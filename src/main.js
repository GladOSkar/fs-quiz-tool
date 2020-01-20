const defaultState = {
	style: 'FSCzech',
	id: null,
	title: null,
	questions: [],
	success: 0,
	submitTimer: 0,
	submitInterval: null,
	totalTimer: 0,
	totalInterval: null,
}

var state = defaultState

function clearState() {

	state = JSON.parse(JSON.stringify(defaultState))

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


function removeLink() {

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


function updateTotalTimer() {

	var timerEls = document.querySelectorAll('.totaltimer')

	var minutes = Math.floor(state.totalTimer / 60)
	var seconds = state.totalTimer % 60

	var text = minutes + ':' + ('0' + seconds).slice(-2)

	for (timerEl of timerEls)
		timerEl.innerHTML = text

	state.totalTimer++

	localStorage.setItem('state', JSON.stringify(state))

}


function startTotalTimer() {

	console.log('Setting totalTimer to ' + state.totalTimer + ' seconds.')

	updateTotalTimer()

	state.totalInterval = setInterval(updateTotalTimer, 1000)

}


function updateSubmitTimer() {

	var button = document.getElementById('quizSubmitButton')

	if (state.submitTimer > 0) {

		button.value = 'Wait ' + state.submitTimer + 's'
		button.disabled = true
		state.submitTimer -= 1

	} else {

		button.value = 'Submit Answers'
		button.disabled = false
		clearInterval(state.submitInterval)

	}

}


function startSubmitTimer(time) {

	state.submitTimer = time || 30

	console.log('Setting submitTimer to ' + state.submitTimer + ' seconds.')

	updateSubmitTimer()

	state.submitInterval = setInterval(updateSubmitTimer, 1000)

}


function parseLine(line) {

	// replace newline markers with html newlines
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

	/* MAGIC:
	 *	1. Find quoted multiline cells (<tab>"a<newline>b"<tab>)
	 *	2. Replace all newlines inside with a special char so the cell won't be
	 *		split later (<tab>"a<specialchar>b"<tab>)
	 *	3. Replace escaped quotes ("a ""b"" c") with single ones ("a "b" c")
	 *	4. Remove the outer quotes and tabs (a<specialchar>b)
	 *	5. Replace all tabs inside with spaces
	 *	6. Re-add outer tabs (<tab>a<specialchar>b<tab>)
	 */

	var text = textEl.value.replace(/\t"([^"\n]|"")+\n([^"]|"")+"\t/g,
		m => m.replace(/\n/g, '⎊')
			  .replace(/""/g, '"')
			  .replace(/^\t"(.*)"\t$/, '$1')
			  .replace(/\t/g, ' ')
			  .replace(/^(.*)$/g, '\t$1\t')
	)

	state.questions = text.split('\n').map(parseLine)

	if (state.questions[0] == null)
		return {success: false}

	localStorage.setItem('state', JSON.stringify(state))

	return {success: true}

}


function renderQuiz() {

	var quizForm = document.querySelector('#quiz form')

	quizForm.innerHTML = ''

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

}


function startQuiz() {

	state.success = false

	console.log('Starting/Resuming quiz. State:')
	console.log(state)

	renderQuiz()

	changeView('quiz')

	if (state.submitTimer > 0)
		startSubmitTimer(state.submitTimer)
	else
		updateSubmitTimer()

	startTotalTimer()

	console.log('Quiz started/resumed')

}

function reStartQuiz() {

	console.log('Restarting quiz');

	state.totalTimer = 0
	state.submitTimer = 0
	state.success = 0

	startQuiz()

}


function updateTitles() {
	document.querySelector('#prescreen h1').innerHTML = state.title || ''
	document.querySelector('#quiz h1').innerHTML = state.title || ''
}

function createQuiz() {

	console.log('Creating new quiz')

	state.title = document.getElementById('titleField').value
	if (state.title == '') {
		alert('Please enter a title')
		return
	}

	clearState()
	removeLink()

	if (parseSpreadsheet().success == false) {
		console.log('Quiz creation failed.')
		return
	}

	console.log('Spreadsheet parsing successful')

	updateTitles()

	changeView('prescreen')

	console.log('Quiz created')

}


function endQuiz() {

	console.log('Ending quiz')

	localStorage.removeItem('state')

	document.querySelector('#quiz form').innerHTML = ''
	changeView('postscreen')

	if (state.submitInterval)
		clearInterval(state.submitInterval)

	clearInterval(state.totalInterval)

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
		var idx = key.slice(1)

		if (state.questions[idx].type == 'ChooseOne' || state.questions[idx].type == 'ChooseAny') {
			state.questions[idx].answers.sort()
			value.sort()
		}

		var correctAnswer = JSON.stringify(state.questions[idx].answers)
		var givenAnswer = JSON.stringify(value)

		console.log('Comparing: ' + givenAnswer + ' == ' + correctAnswer + '?: ' + (givenAnswer == correctAnswer))

		if (givenAnswer == correctAnswer)
			correct++

	}

	var text = '' + correct + '/' + state.questions.length + ' questions answered correctly.\n'

	state.success = (correct == state.questions.length)

	text += state.success ? 'Yay you did it!' : 'Try again!'

	if (!state.success) {
		renderQuiz()
		startSubmitTimer()
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

const memes = [
	'GE-SUND-BRUN-NEN-CENTER!',
	'Deine Mudda! Berlin!',
	'Eine Runde Kicker?',
	'Hulkdrian!',
	'Jetz\' bin i\' wieda doa',
	'Mmmmh Carbonstaub',
	'#würthshausfranz',
	'#berlinerluft',
	'FaST<b>TUBe</b>, not Fast<b>COCUE</b>',
	'Yes, we CAN',
	'Ist in der Cloud.',
	'Ist im Wiki.',
	'Ich liiebe Teamcenter <3',
	'Podio kann alles!',
	'Let\'s build 3 fucking racecars!',
	'Der Fahrstuhl ist kaputt',
	'Frau Ipta reißt euch den Kopf ab!',
	'Max, Max, Max, Max, Max, Max, MaxMax!',
	'Julian, Anwärter, Firewall',
	'Diese Webseite ist geerdet.',
	'Wer AMS sagt muss auch BMS sagen',
	'Ist der Kabelbinder in der BOM?',
	'*Fistbump*',
	'Nividia!',
	'Ihr schafft das! :)',
	'Klotzen, nicht kleckern!',
	'*revving noises*',
	'Resistance is futile',
	'Jan schweißt das noch',
	'Would Claude approve of this?',
	'Im CAD hat\'s noch gepasst',
	'¯\\_(ツ)_/¯',
	'AMK Brudi',
	'Mmmhh cones',
]

window.onload = async function() {

	console.log('onload')

	var browserWarning = document.getElementById('browserwarning')

	browserWarning.style.display = (() => 'none')()

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
	document.getElementById('meme').innerHTML = memes[Math.floor(Math.random()*memes.length)]

	if (stateString && !useUrl)
		startQuiz()

	if (!stateString && !useUrl)
		changeView('spreadsheet')

	console.log('onload complete')

}
