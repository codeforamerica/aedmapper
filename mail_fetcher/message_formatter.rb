require 'mail'
require 'json'
require 'base64'
require 'exifr'
load 'mail_formatter.rb'

module Gmail
  class MessageFormatter
    attr_accessor :seqno, :uid, :mail, :envelope, :rfc822, :size, :flags

    def initialize(x)
      @seq = x.seqno
      @uid = x.attr['UID']
      @message_id = x.attr["MESSAGE-ID"]
      @envelope = x.attr["ENVELOPE"]
      @size = x.attr["RFC822.SIZE"] # not sure what units this is
      @flags = x.attr["FLAGS"]  # e.g. [:Seen]
      @rfc822 = x.attr['RFC822']
      @mail = Mail.new(x.attr['RFC822'])
    end
    
    def attributes
      {
        :date => Time.parse(@envelope.date).utc.iso8601,
        :subject => format_subject(@envelope.subject),
        :from => format_recipients(@envelope.from),
        :to => format_recipients(@envelope.to),
        :body => message,
        :flags => @flags,
        "_id" => gmail_plus_label,
        :raw_mail => @mail.to_s,
        '_attachments' => format_attachments,
        :geometry => format_attachment_gps[:geometry],
        :altitude => format_attachment_gps[:altitude]
      }.delete_if{|k,v| v == "" || v == nil}
    end

    def gmail_plus_label
      recipient = format_recipients(@envelope.to)[0]
      plus_label = recipient =~ /\+/ ? recipient.split("+")[1].split("@")[0] : nil
    end
    
    def subject
      envelope.subject
    end

    def sender
      envelope.from.first
    end

    def in_reply_to
      envelope.in_reply_to 
    end

    def message_id
      envelope.message_id
    end

    def message
      formatter = MailFormatter.new(@mail)
      message_text = <<-EOF
#{format_headers(formatter.extract_headers)}

#{formatter.process_body}
EOF
    end
    
    def to_decimal(dms)
      dms[0].to_f + dms[1].to_f / 60 + dms[2].to_f / 3600
    end
        
    def to_geojson(exif)
      lon_exif = exif.gps_longitude
      lon = to_decimal(lon_exif.map(&:to_f))
      lon = -lon if exif.gps_longitude_ref == "W"
      lat_exif = exif.gps_latitude
      lat = to_decimal(lat_exif.map(&:to_f))
      lat = -lat if exif.gps_latitude_ref == "S"
      {
        :type => "Point", 
        :coordinates => [lon, lat]
      }
    end
    
    def format_attachment_gps
      geometry, altitude = nil, nil
      if @mail.attachments.length > 0
        @mail.attachments.each do |attachment|    
          next unless attachment['Content-type'].to_s =~ /jpe?g/i
          body = attachment.body.decoded      
          r, w = IO.pipe
          w.write_nonblock(body)
          exif = EXIFR::JPEG.new(r)
          geometry = to_geojson(exif)
          altitude = exif.gps_altitude.to_f
          altitude = -altitude if exif.gps_altitude_ref.to_i < 0
          break
        end
      end
      {geometry: geometry, altitude: altitude}
    end
    
    def format_attachments
      attachments = {}
      if @mail.attachments.length > 0
        @mail.attachments.each do |attachment|
          begin
            attachments[attachment.filename] = {
              content_type: attachment.content_type.to_s.split("\;")[0],
              data: Base64.encode64(attachment.body.decoded)
            }
          rescue Exception => e
            puts "unable to process #{attachment.filename}"
          end
        end
      end
      attachments
    end

    def format_subject(subject)
      Mail::Encodings.unquote_and_convert_to((subject || ''), 'UTF-8')
    end

    def format_recipients(recipients)
      recipients ? recipients.map{|m| [m.mailbox, m.host].join('@')} : ""
    end

    def format_parts_info(parts)
      lines = parts.select {|part| part !~ %r{text/plain}}
      if lines.size > 0
        "\n#{lines.join("\n")}"
      end
    end

    def format_headers(hash)
      lines = []
      hash.each_pair do |key, value|
        if value.is_a?(Array)
          value = value.join(", ")
        end
        lines << "#{key.gsub("_", '-')}: #{value}"
      end
      lines.join("\n")
    end

  end
end