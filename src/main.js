var state = {
	style: 'FSCzech',
	id: null,
	title: null,
	questions: [],
	timer: 0,
	interval: null,
	success: 0
}


function changeView(view) {

	for (el of document.querySelectorAll('.view'))
		el.style.display = 'none'

	document.getElementById(view).style.display = 'block'

}


function showLink() {

	var link = 'https://quiz.fasttube.de/?id=' + state.id

	var linkEl = document.getElementById('shareLink')
	linkEl.href = link
	linkEl.innerHTML = link

	document.querySelector('#sharing input').style.display = 'none'

}


async function shareQuiz() {

	if (state.id) {
		console.log('Showing saved local link')
		showLink()
		return
	}

	console.log('Saving quiz to server. QuizData:')

	var quizData = {
		title: state.title,
		questions: state.questions
	}

	console.log(quizData)
	console.log('Waiting for id')

	var db = 'https://quiz.fasttube.de/db/'

	var response = await fetch(db, {
		method: 'POST',
		headers: {'Content-Type': 'text/plain'},
		body: JSON.stringify(quizData)
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


function updateTimer() {

	var button = document.getElementById('quizSubmitButton')

	if (state.timer > 0) {

		button.value = 'Wait ' + state.timer + 's'
		button.disabled = true
		state.timer -= 1

	} else {

		button.value = 'Submit Answers'
		button.disabled = false
		clearInterval(state.interval)

	}

	localStorage.setItem('state', JSON.stringify(state))

}


function startTimer(time) {

	state.timer = time || 30

	console.log('Setting timer to ' + state.timer + ' seconds.')

	updateTimer()

	state.interval = setInterval(updateTimer, 1000)

}


function parseLine(line) {

	// replace newline markers with newlines
	var els = line.replace(/⎊/g, '<br>').split('\t')

	if (els.length < 4) {
		alert('Information missing. At least 4 columns needed.')
		return null
	}

	var type = els[0]

	// For multiple-choice, split lines into array
	var choices = els[2].split('<br>')

	// If multiple answers are allowed, they are ampersand-separated
	var answers = (els[3]) ? els[3].split('<br>') : null

	return {
		question: els[1] || '[No question provided]',
		type: type,
		choices: choices,
		answers: answers,
		explanation: els[4] || '[No explanation provided]',
		author: els[5] || '[No author provided]',
		picture: els[6] || null,
	}

}


function parseSpreadsheet() {

	console.log('Parsing spreadsheet data')

	var textEl = document.getElementById('questions')

	var text = textEl.value.replace(/"([^"]|"")+"/g, m => m.replace(/\n/g, '⎊').replace(/""/g, '"').replace(/^"(.*)"$/, '$1'))

	state.questions = text.split('\n').map(parseLine)

	if (state.questions[0] == null)
		return {success: false}

	localStorage.setItem('state', JSON.stringify(state))

	return {success: true}

}


function startQuiz() {

	state.success = false

	console.log('Starting/Resuming quiz. State:')
	console.log(state)

	var quizForm = document.querySelector('#quiz form')

	for (const [i, q] of state.questions.entries()) {

		var html = ''

		html += `<h3>Question #${i+1}</h3>`
		html += `<h4>${q.question}</h4>`

		if (q.picture)
			html += `<img src="${q.picture}">`

		if (q.type == 'ChooseOne' || q.type == 'ChooseAny') {

			var choices = Array.from(q.choices.entries())
			var shuffled = choices.sort(() => Math.random() - 0.5)

			for ([ci, c] of shuffled)
				html += (q.type == 'ChooseOne')
					? `<label><input type="radio" name="q${i}" value="${ci+1}"> <p>${c}</p></label><br>`
					: `<label><input type="checkbox" name="q${i}" value="${ci+1}"> <p>${c}</p></label><br>`

		} else {

			for (c of q.choices)
				html += `<label>${c}<input type="text" name="q${i}"></label>`

		}


		quizForm.innerHTML += html

	}

	changeView('quiz')

	if (state.timer > 0)
		startTimer(state.timer)
	else
		updateTimer()

	console.log('Quiz started/resumed')

}

function updateTitles() {
	document.querySelector('#prescreen h1').innerHTML = state.title || ''
	document.querySelector('#quiz h1').innerHTML = state.title || ''
}

function createQuiz() {

	console.log('Creating new quiz')

	if (parseSpreadsheet().success == false)
		return

	console.log('Spreadsheet parsing successful')

	state.timer = 0

	state.title = document.getElementById('titleField').value
	updateTitles()

	changeView('prescreen')

	console.log('Quiz created')

}


function endQuiz() {

	console.log('Ending quiz')

	localStorage.removeItem('state')

	document.querySelector('#quiz form').innerHTML = ''
	changeView('postscreen')

	if (state.interval)
		clearInterval(state.interval)

	console.log('Quiz ended')

}


function mergeKeyReducer(acc, entry) {

	if (!acc[entry[0]])
		acc[entry[0]] = []

	acc[entry[0]].push(entry[1])

	return acc

}


function submitQuiz() {

	console.log('Submitting quiz. State:')
	console.log(state)

	var quizForm = document.querySelector('#quiz form')

	var data = new FormData(quizForm)

	var responses = Array.from(data.entries()).reduce(mergeKeyReducer, {})

	console.log(responses)

	var correct = 0

	for (var [key, value] of Object.entries(responses)) {

		console.log(key + ": " + value)

		// "q3" -> 3
		var idx = key[1]

		if (state.questions[idx].type == 'ChooseOne' || state.questions[idx].type == 'ChooseAny') {
			state.questions[idx].answers.sort()
			value.sort()
		}

		if (JSON.stringify(state.questions[idx].answers) == JSON.stringify(value))
			correct++

	}

	var text = '' + correct + '/' + state.questions.length + ' questions answered correctly.\n'

	state.success = (correct == state.questions.length)

	text += state.success ? 'Yay you did it!' : 'Try again!'

	if (!state.success) {
		startTimer()
		alert(text)
	}

	if (state.success) {
		document.querySelector('#postscreen h1').innerHTML = `Yay, we're done!<br>Everything is correct :)`
		endQuiz()
	}

	console.log('Quiz submitted')

}


function abortQuiz() {

	console.log('Aborting quiz')

	if (!confirm('You sure you want to abort this quiz? Your progress will be lost.'))
		return

	document.querySelector('#postscreen h1').innerHTML = `Quiz cancelled.`

	endQuiz()

	console.log('Quiz cancelled')

}

function idFromUrl() {

	var s = window.location.href.split('id=')

	if (s.length <= 1)
		return null

	return s[1].split('&')[0]

}

async function fetchQuiz(id) {

	console.log('Fetching quiz')

	var url = 'https://quiz.fasttube.de/db/' + id

	var response = await fetch(url)

	if (response.ok == false) {
		alert('Something went wrong while loading this quiz')
		return
	}

	var json = await response.json()

	console.log('Quiz fetched. Response:')
	console.log(json)

	return json

}

window.onload = async function() {

	console.log('onload')

	var stateString = localStorage.getItem('state')

	var urlId = idFromUrl()
	console.log('URL ID:' + urlId)

	if (stateString) {

		console.log('Loading local state')
		state = JSON.parse(stateString)

	}

	// only fetch if it's a different one
	var useUrl = (urlId && urlId != state.id)
	if (useUrl) {

		console.log('Using remote quiz from url')

		quiz = await fetchQuiz(urlId)
		state.title = quiz.title
		state.questions = quiz.questions
		state.id = urlId

		changeView('prescreen')

	}

	updateTitles()

	if (stateString && !useUrl)
		startQuiz()

	if (!stateString && !useUrl)
		changeView('spreadsheet')

	console.log('onload complete')

}
