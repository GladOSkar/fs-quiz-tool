NAME = fs-quiz-tool

HTML = /var/www/html

all: run

run:
	cd src && python3 -m http.server 8000

install:
	sudo cp src/* $(HTML)/$(NAME)/
