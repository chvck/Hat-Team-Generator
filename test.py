import urllib2
import json

"""
An example file for testing the main application
"""

data = {'message': 'herp derp', 'host': '127.0.0.1', 'password': 'secret'}
data_json = json.dumps(data)
host = 'http://localhost:5000/generate'
req = urllib2.Request(host, data_json, {'content-type': 'application/json'})
response_stream = urllib2.urlopen(req)
response = response_stream.read()