function parseLine(line) {

	// replace newline markers with html newlines
	var els = line.replace(/⎊/g, '<br>').split('\t')

	var q = {}

	if (els[0] != '') {
		if (	els[0] == 'ChooseOne' ||
				els[0] == 'ChooseAny' ||
				els[0] == 'Text') {
			q.type = els[0]
		} else {
			alert('Invalid type given on one line')
			return null
		}
	} else {
		alert('No type given on one line')
		return null
	}

	if (els[1]) {
		q.question = els[1]
	} else {
		alert('No question given on one line')
		return null
	}

	// Split choices into array
	// Choices for text questions are labels
	// No choices (empty string) are okay for text questions
	// Also filter out empty lines because some people can't use spreadsheets
	if (els[2] || (q.type == 'Text' && els[2] == '')) {
		q.choices = els[2].split('<br>').filter(el => el != "")
	} else {
		alert('No choices given at question "'
			+ q.question + '"')
		return null
	}

	// If multiple answers are allowed, they are newline-separated
	// Also filter out empty lines because some people can't use spreadsheets
	if (els[3] && els[3] != '') {
		q.answers = els[3].split('<br>').filter(el => el != "")
	} else {
		alert('No answers given at question "'
			+ q.question + '"')
		return null
	}

	// Optional parameters
	q.explanation	= els[4] || '[No explanation provided]'
	q.author		= els[5] || '[No author provided]'
	q.picture		= els[6] || null

	return q

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

	var raw = textEl.value.trim()

	var text = raw.replace(/\t"([^"\n]|"")+\n([^"]|"")*"/g,
		m => m.replace(/\n/g, '⎊')
			  .replace(/""/g, '"')
			  .replace(/^\t"(.*)"$/, '$1')
			  .replace(/\t/g, ' ')
			  .replace(/^(.*)$/g, '\t$1')
	)

	state.questions = text.split('\n').map(parseLine)

	if (state.questions.some(el => el == null)) {
		alert('Erroneous data. Please check and re-enter.')
		return {success: false}
	}

	localStorage.setItem('state', JSON.stringify(state))

	return {success: true}

}
