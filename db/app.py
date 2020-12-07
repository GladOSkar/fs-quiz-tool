from flask import Flask, request, Response
import json
import string
import random
import atexit

app = Flask(__name__)

filename = 'db.json'
id_length = 32

data = {}


def startup():
	global data
	try:
		fd = open(filename)
		data = json.load(fd)
	except FileNotFoundError:
		pass


@app.after_request
def add_headers(response):
	response.headers['Access-Control-Allow-Origin'] = '*'
	response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
	return response


@app.route('/<id>', methods = ['GET'])
def get(id):
	if id in data:
		return data[id]
	else:
		return 'Error: Not found', 404


def generateRandomString():
	return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(id_length))

@app.route('/', methods = ['POST'])
def post():
	id = generateRandomString()
	data[id] = request.data.decode('UTF-8')
	return id, 201


def dumpDB():
	if len(data) == 0:
		return

	fd = open(filename, 'w+')
	try:
		json.dump(data, fd)
	finally:
		fd.close()


startup()
atexit.register(dumpDB)

if __name__ == "__main__":
	app.run(host='0.0.0.0')
