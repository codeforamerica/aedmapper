require 'net/smtp'
require 'mustache'
require 'httparty'
load 'smtp_api.rb'

module Mailer
  class AEDResponse
    
    # simple function to create a multipart MIME email
    # specify from to subject plaintext htmltext and an smtpapi header
    def create_mime(from, to, subject, text, html, header)
      boundary = "----------=_" + rand(99999999999999999).to_s.center(20, rand(9).to_s)
      content = "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"\n"
      encoding = "Content-Transfer-Encoding: binary\nMIME-Version: 1.0\n"
      f = "From: %s\n" %from
      t = "To: %s\n" %to
      s = "Subject: %s\n" %subject
      x = header + "\n"
      mimetype = "This is a multi-part message in MIME format...\n\n--" + boundary + "\n"
      text_define = "Content-Type: text/plain\nContent-Disposition: inline\nContent-Transfer-Encoding: 7bit\n\n"
      html_define = "Content-Type: text/html\nContent-Disposition: inline\nContent-Transfer-Encoding: 7bit\n\n"

      message = content + encoding + f + t + s + x + mimetype + text_define + text + "\n--" + boundary + "\n" + html_define + html + "\n--" + boundary + "--\n\n"
      return message
    end
    
    def initialize(doc_id)
      config = YAML::load File.read(File.expand_path('~/.aedmapperrc'))
      doc_url = config['couch_url'] + doc_id
      doc = JSON.parse(HTTParty.get(doc_url).body)
      
      return "doc missing: #{doc}" if doc.keys.index {|key| key == "error"}
      return "no geolocation -- skipping" unless doc['geometry']
      
      # Specify that this is an initial contact message
      hdr = SMTPAPI.new()
      hdr.setCategory("initial")

      from = 'thanks@aedmapper.com'
      to = doc['from'][0]
      location = "#{doc['geometry']['coordinates'][1]},#{doc['geometry']['coordinates'][0]}"
      map = "http://maps.google.com/maps/api/staticmap?center=#{location}&zoom=16&size=320x250&maptype=roadmap&markers=size:mid%7Ccolor:red%7C#{location}&sensor=false"
      subject = "AED Successfully Mapped!"
      edit_url = "http://aedmapper.com##{doc_id}"

      text = Mustache.render(File.read('aed_response.txt'), :map_url => map, :doc_url => doc_url, :edit_url => edit_url, :subject => subject)
      html = Mustache.render(File.read('aed_response.html'), :map_url => map, :doc_url => doc_url, :edit_url => edit_url, :subject => subject)

      header = "X-SMTPAPI: %s\n" %hdr.asJSON()
      mime =  create_mime(from, to, subject, text, html, header)

      # send the message
      smtp = Net::SMTP.start('smtp.sendgrid.net', 25, from, config['sendgrid_user'], config['sendgrid_pass'], :plain)
      smtp.send_message mime, from, to
      smtp.finish
    end
  end
end