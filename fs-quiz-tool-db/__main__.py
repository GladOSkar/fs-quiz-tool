from .app import app

if __name__ == "__main__":

	@app.after_request
	def add_headers(response):
		response.headers['Access-Control-Allow-Origin'] = '*'
		response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
		return response

	app.run(host='0.0.0.0', port=12345)
