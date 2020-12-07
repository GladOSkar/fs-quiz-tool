from .app import app
from flask import send_from_directory

if __name__ == "__main__":

	@app.route('/')
	def get_root():
		return send_from_directory('../web', 'index.html')

	@app.route('/<path:path>')
	def get_path(path):
		return send_from_directory('../web', path)

	@app.after_request
	def add_headers(response):
		response.headers['Access-Control-Allow-Origin'] = '*'
		response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
		return response

	app.run(host='0.0.0.0', port=12345)
