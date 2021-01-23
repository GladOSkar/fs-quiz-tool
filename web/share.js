function showLink() {

	var link = location.origin + '/?id=' + state.id
	history.pushState(state.id, '', link)

	var linkEl = document.getElementById('shareLink')
	linkEl.href = link
	linkEl.innerHTML = link

	document.querySelector('#sharing input').style.display = 'none'

}


function removeLink() {

	var link = location.origin
	history.pushState('', '', link)

	var linkEl = document.getElementById('shareLink')
	linkEl.href = ''
	linkEl.innerHTML = ''

	document.querySelector('#sharing input').style.display = 'inline-block'

}


async function shareQuiz() {

	if (state.id) {
		console.log('Showing saved local link')
		showLink()
		return
	}

	console.log('Saving quiz to server. QuizData:')

	var quizData = {
		style: state.style,
		title: state.title,
		questions: state.questions,
		submitTries: state.submitTries,
		submitTime: state.submitTime
	}

	console.log(quizData)
	console.log('Waiting for id')

	var db = location.origin + '/db'

	var response = await fetch(db, {
		method: 'POST',
		headers: {'Content-Type': 'text/plain'},
		body: JSON.stringify(quizData, (k,v) => (v == Infinity) ? '__Infinity' : v)
	})

	if (response.ok == false) {
		alert('Something went wrong while sharing')
		return
	}

	var responseBody = await response.text()
	console.log('Received id: ' + responseBody)
	state.id = responseBody

	showLink()

}

function idFromUrl() {

	var s = window.location.search.split('id=')

	if (s.length <= 1)
		return null

	return s[1].split('&')[0]

}

async function fetchQuiz(id) {

	console.log('Fetching quiz')

	var url = location.origin + '/db/' + id

	var response = await fetch(url)

	if (response.ok == false) {
		alert('Something went wrong while loading this quiz')
		return
	}

	var text = await response.text()

	var json = JSON.parse(text, (k,v) => (v == '__Infinity') ? Infinity : v)

	console.log('Quiz fetched. Response:')
	console.log(json)

	return json

}
