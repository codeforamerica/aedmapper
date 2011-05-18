load 'couch_client.rb'
load 'imap_client.rb'
load 'aed_response.rb'
require 'uri'

# export AED_COUCH_URL="http://localhost:5984/mail/"
config = YAML::load File.read(File.expand_path('~/.aedmapperrc'))
@couch_url = URI.parse(config['couch_url'])

@imap = Gmail::ImapClient.new(config)
@couch = Couch::Server.new(@couch_url.host, @couch_url.port)

@imap.with_open do |imap|
  ['INBOX'].each do |mailbox|
    imap.select_mailbox mailbox
    imap.archive_messages() do |message|
      if message.gmail_plus_label
        doc = JSON.parse(@couch.get(@couch_url.path + message.gmail_plus_label).body)
        doc = {} if doc.has_key? 'error'
        doc.merge! message.attributes
        @couch.put("/mail/" + doc['_id'], doc.to_json)
      else
        doc = {'_id' => JSON.parse(@couch.post(@couch_url.path, message.attributes.to_json).body)['id']}
      end
      puts Mailer::AEDResponse.new(doc['_id'])
    end
  end
end