from flask import Flask, request
import json
import string
import random
import atexit

app = Flask(__name__)

filename = 'db.json'
id_length = 16

data = {}


def startup():

	global data
	try:
		fd = open(filename)
		data = json.load(fd)
	except FileNotFoundError:
		pass


@app.route('/<id>', methods = ['GET'])
def get(id):
	return data[id] if id in data else ('Error: Not found', 404)


def generateRandomString():
	return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(id_length))

def generateNewKey():

	id = generateRandomString()
	while id in data:
		id = generateRandomString()

	return id

@app.route('/', methods = ['POST'])
def post():

	id = generateNewKey()
	data[id] = request.data.decode('UTF-8')

	return id, 201


def dumpDB():

	if len(data) == 0:
		return

	try:
		fd = open(filename, 'w+')
		json.dump(data, fd)
	finally:
		fd.close()


startup()
atexit.register(dumpDB)
