#!/usr/bin/ruby
# Version 1.0
# Last Updated 6/22/2009
require 'json'
 
class SMTPAPI
 
  def initialize()
    @data = {}
  end  
 
  def addTo(to)
    @data['to'] ||= []
    @data['to'] += to.kind_of?(Array) ? to : [to]
  end 
 
  def addSubVal(var, val)
    if not @data['sub']
      @data['sub'] = {}
    end
    if val.instance_of?(Array)
      @data['sub'][var] = val  
    else
      @data['sub'][var] = [val]    
    end
  end
 
  def setUniqueArgs(val)
    if val.instance_of?(Hash)
      @data['unique_args'] = val
    end
  end
 
  def setCategory(cat)
 
    @data['category'] = cat
  end
 
  def addFilterSetting(fltr, setting, val)
    if not @data['filters']
      @data['filters'] = {}
    end
    if not @data['filters'][fltr]
      @data['filters'][fltr] = {}
    end
    if not @data['filters'][fltr]['settings']
      @data['filters'][fltr]['settings'] = {}
    end
    @data['filters'][fltr]['settings'][setting] = val
  end
 
  def asJSON()
    json = JSON.generate @data
    return json.gsub(/(["\]}])([,:])(["\[{])/, '\\1\\2 \\3')
  end
 
  def as_string()
    json  = asJSON()
    str = 'X-SMTPAPI: %s' % json.gsub(/(.{1,72})( +|$\n?)|(.{1,72})/,"\\1\\3\n")
    return str    
  end
 
end