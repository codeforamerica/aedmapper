# encoding: UTF-8
require 'timeout'
require 'yaml'
require 'mail'
require 'net/imap'
require 'time'
load 'message_formatter.rb'

module Gmail
  class ImapClient
    attr_accessor :max_seqno 
    def initialize(config)
      @username, @password = config['username'], config['password']
      @imap_server = config['server'] || 'imap.gmail.com'
      @imap_port = config['port'] || 993
    end

    def log s
      if s.is_a?(Net::IMAP::TaggedResponse)
        $stderr.puts s.data.text
      else
        $stderr.puts s
      end
    end

    def with_open
      @imap = Net::IMAP.new(@imap_server, @imap_port, true, nil, false)
      @imap.login(@username, @password)
      list_mailboxes
      yield self
    ensure
      close
    end

    def close
      Timeout::timeout(5) do
        @imap.close rescue Net::IMAP::BadResponseError
        @imap.disconnect rescue IOError
      end
    rescue Timeout::Error
      log "Attempt to close connection timed out"
    end

    def select_mailbox(mailbox)
      @imap.select(mailbox)
      @mailbox = mailbox
    end

    # TODO skip drafts and spam box and all box 
    def list_mailboxes
      @mailboxes = (@imap.list("", "*") || []).select {|struct| struct.attr.none? {|a| a == :Noselect}}. map {|struct| struct.name}.uniq
      log "Loaded mailboxes: #{@mailboxes.inspect}"
    end

    def archive_messages(opts = {})
      opts = {range: (0..-1), per_slice: 10}.merge(opts)
      uids = @imap.uid_search('ALL')
      range = uids[opts[:range]]
      range.each_slice(opts[:per_slice]) do |uid_set|
        @imap.uid_fetch(uid_set, ["FLAGS", 'ENVELOPE', "RFC822", "RFC822.SIZE", 'UID']).each do |x|
          yield MessageFormatter.new(x)
          @imap.uid_store([x.attr['UID']], "+FLAGS", [:Deleted])
        end
      end
    end
  end
end