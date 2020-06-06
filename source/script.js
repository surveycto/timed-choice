/* global fieldProperties, setAnswer, goToNextField, getPluginParameter, getMetaData, setMetaData */

const choices = fieldProperties.CHOICES
const appearance = fieldProperties.APPEARANCE
const fieldType = fieldProperties.FIELDTYPE
const numChoices = choices.length - 1 // Subtract 1, because the last choice is the 'pass' value

const timerContainer = document.querySelector('#timer-container')
const labelContainer = document.querySelector('#label')
const hintContainer = document.querySelector('#hint')

// Appearance containers
const radioButtonsContainer = document.getElementById('radio-buttons-container') // default radio buttons
const selectDropDownContainer = document.getElementById('select-dropdown-container') // minimal appearance
const likertContainer = document.querySelector('#likert-container') // likert
const choiceLabelContainer = document.querySelector('#choice-labels')
const listNoLabelContainer = document.querySelector('#list-nolabel')

const choiceContainers = document.querySelectorAll('.choice-container') // Go through all the available choices
const timerDisp = timerContainer.querySelector('#timerdisp')
const unitDisp = timerContainer.querySelector('#unitdisp')

// PARAMETERS
var dispTimer = getPluginParameter('disp')
var timeStart = getPluginParameter('duration')
var unit = getPluginParameter('unit')
var missed = getPluginParameter('pass')
var resume = getPluginParameter('continue')
var autoAdvance = getPluginParameter('advance')
var block = getPluginParameter('block')
var leftoverTime = parseInt(getMetaData())

// Time and other vars
var startTime // This will get an actual value when the timer starts in startStopTimer()
var round = 1000 // Default, may be changed
var timeLeft // Starts this way for the display.
var timePassed = 0 // Time passed so far
var complete = false
var currentAnswer
var allChoices = []

// Setup defaults of parameters if they are not defined
if (dispTimer == 0) {
  dispTimer = false
  timerContainer.parentElement.removeChild(timerContainer)
} else {
  dispTimer = true
}

if ((timeStart == null) || isNaN(timeStart)) {
  timeStart = 10000
} else {
  timeStart *= 1000
}

if (unit == null) {
  unit = 's'
}
unitDisp.innerHTML = unit

if (missed == null) {
  missed = '-99'
} else {
  missed = String(missed)
}

if ((autoAdvance == 0) || ((!dispTimer) && (autoAdvance != 1))) {
  autoAdvance = false
} else {
  autoAdvance = true
}

if (block == 0) {
  block = false
} else {
  block = true
}

if (resume == 1) {
  resume = true
} else {
  resume = false
  for (const c of choices) { // Checks each choice to see if the form has already been completed
    if (c.CHOICE_SELECTED) { // If a choice has a value, then that means the field is already complete
      complete = true
      console.log('Choice is selected:')
      console.log(c)
      if (autoAdvance) {
        goToNextField()
      }
      break // No need to check anymore if even one choice has been selected
    } // End going through each choice
  }

  if (!complete) {
    setAnswer(missed) // This is so if the respondent leaves the field, then the answer will already be set. Only set if there is no answer yet, as setup in the FOR loop above
  }
}

// Check to make sure "pass" value is a choice value
for (const c of choices) {
  allChoices.push(c.CHOICE_VALUE)
}
if (allChoices.indexOf(missed) === -1) {
  const errorMessage = missed + ' is not specified as a choice value. Please add a choice with ' + missed + ' as a choice value, or this field plug-in will not work.'
  document.querySelector('#error').innerHTML = 'Error: ' + errorMessage
  throw new Error(errorMessage)
}

// ADJUST APPEARANCES

// Prepare the current webview, making adjustments for any appearance options
if ((appearance.includes('minimal') === true) && (fieldType === 'select_one')) { // minimal appearance
  removeContainer('minimal')
  selectDropDownContainer.style.display = 'block' // show the select dropdown
} else if ((appearance.includes('likert') === true) && (fieldType === 'select_one')) { // likert appearance
  removeContainer('likert')
  likertContainer.style.display = 'flex' // show the likert container
  // likert-min appearance
  if (appearance.includes('likert-min') === true) {
    var likertChoices = document.getElementsByClassName('likert-choice-container')
    for (var i = 1; i < likertChoices.length - 1; i++) {
      likertChoices[i].querySelector('.likert-choice-label').style.display = 'none' // hide all choice labels except the first and last
    }
    likertChoices[0].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-first') // apply a special class to the first choice label
    likertChoices[likertChoices.length - 1].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-last') // apply a special class to the last choice label
  }
} else if (appearance.includes('list-nolabel')) {
  removeContainer('nolabel')
  labelContainer.parentElement.removeChild(labelContainer)
  hintContainer.parentElement.removeChild(hintContainer)
} else if (appearance.includes('label')) {
  removeContainer('label')
  labelContainer.parentElement.removeChild(labelContainer)
  hintContainer.parentElement.removeChild(hintContainer)
} else { // all other appearances
  if (fieldProperties.LANGUAGE !== null && isRTL(fieldProperties.LANGUAGE)) {
    radioButtonsContainer.dir = 'rtl'
  }
  removeContainer('radio')
  // quick appearance
  if ((appearance.includes('quick') === true) && (fieldType === 'select_one')) {
    for (var i = 0; i < choiceContainers.length; i++) {
      choiceContainers[i].classList.add('appearance-quick') // add the 'appearance-quick' class
      choiceContainers[i].getElementsByClassName('choice-label-text')[0].insertAdjacentHTML('beforeend', '<svg class="quick-appearance-icon"><use xlink:href="#quick-appearance-icon" /></svg>') // insert the 'quick' icon
    }
  }
}

// Removes the "missed" value as a visible choice
const passTd = document.querySelector('#choice-' + missed)
passTd.parentElement.removeChild(passTd) // Remove the pass value as a label

// Retrieves the button info now that all of the unneeded ones have been removed

const allButtons = document.querySelectorAll('input[name="opt"]') // This is declared here so the unneeded boxes have already been removed.

// If it set to not resume, and the field has already been accessed before, then this activate blockInput. Doing it now instead of before, since not all of the buttons were available yet.
if (complete) {
  blockInput()
}

// Changes checkboxes to radio buttons if select_one
const numButtons = allButtons.length
if (fieldType === 'select_one') { // Changes input type
  for (const c of allButtons) {
    const box = c
    box.type = 'radio'
  }
}

// minimal appearance
if ((appearance.includes('minimal') === true) && (fieldType === 'select_one')) {
  selectDropDownContainer.onchange = change // when the select dropdown is changed, call the change() function (which will update the current value)
} else if ((appearance.includes('likert') === true) && (fieldType === 'select_one')) { // likert appearance
  var likertButtons = document.querySelectorAll('div[name="opt"]')
  var numLikert = likertButtons.length
  for (var i = 0; i < numLikert; i++) {
    likertButtons[i].onclick = function () {
      if (!(complete && block)) { // This way, cannot be changed if the field is complete, and a block is setup
        // clear previously selected option (if any)
        var selectedOption = document.querySelector('.likert-input-button.selected')
        if (selectedOption) {
          selectedOption.classList.remove('selected')
        }
        this.classList.add('selected') // mark clicked option as selected
        change.apply({ value: this.getAttribute('data-value') }) // call the change() function and tell it which value was selected
      } // End field is not complete
    } // End function for what happens when button is clicked
  } // End loop through each likert choice
} else { // all other appearances
  for (var i = 0; i < numButtons; i++) {
    allButtons[i].onchange = function () {
      // remove 'selected' class from a previously selected option (if any)
      var selectedOption = document.querySelector('.choice-container.selected')
      if ((selectedOption) && (fieldType === 'select_one')) {
        selectedOption.classList.remove('selected')
      }
      this.parentElement.classList.add('selected') // add 'selected' class to the new selected option
      change.apply(this) // call the change() function and tell it which value was selected
    }
  }
}

// Timing calculations
if (unit === 'ms') {
  unit = 'milliseconds'
  round = 1
} else if (unit === 'cs') {
  unit = 'centiseconds'
  round = 10
} else if (unit === 'ds') {
  unit = 'deciseconds'
  round = 100
} else {
  unit = 'seconds'
  round = 1000
}

establishTimeLeft()
setInterval(timer, 1)

// FUNCTIONS
function clearAnswer () {
  // minimal appearance
  if (appearance.includes('minimal') === true) {
    selectDropDownContainer.value = ''
  } else if (appearance.includes('likert') === true) { // likert appearance
    var selectedOption = document.querySelector('.likert-input-button.selected')
    if (selectedOption) {
      selectedOption.classList.remove('selected')
    }
  } else { // all other appearances
    var selectedOption = document.querySelector('input[name="opt"]:checked')
    if (selectedOption) {
      selectedOption.checked = false
      selectedOption.parentElement.classList.remove('selected')
    }
  }
  setAnswer('')
}

// Removed the containers that are not to be used
function removeContainer (keep) {
  if (keep !== 'radio') {
    radioButtonsContainer.parentElement.removeChild(radioButtonsContainer) // remove the default radio buttons
  }

  if (keep !== 'minimal') {
    selectDropDownContainer.parentElement.removeChild(selectDropDownContainer) // remove the select dropdown contrainer
  }

  if (keep !== 'likert') {
    likertContainer.parentElement.removeChild(likertContainer) // remove the likert container
  }

  if (keep !== 'label') {
    choiceLabelContainer.parentElement.removeChild(choiceLabelContainer)
  }

  if (keep !== 'nolabel') {
    listNoLabelContainer.parentElement.removeChild(listNoLabelContainer)
  }
}

// Save the user's response (update the current answer)
function change () {
  if (fieldType === 'select_one') {
    setAnswer(this.value)
    currentAnswer = this.value
    // If the appearance is 'quick', then also progress to the next field
    if (appearance.includes('quick') === true) {
      goToNextField()
    }
  } else {
    gatherAnswer()
  }
}

function gatherAnswer () {
  const selected = []
  for (let c = 0; c < numChoices; c++) {
    if (allButtons[c].checked === true) {
      selected.push(choices[c].CHOICE_VALUE)
    }
  }
  currentAnswer = selected.join(' ')
  setAnswer(currentAnswer)
}

// If the field label or hint contain any HTML that isn't in the form definition, then the < and > characters will have been replaced by their HTML character entities, and the HTML won't render. We need to turn those HTML entities back to actual < and > characters so that the HTML renders properly. This will allow you to render HTML from field references in your field label or hint.
function unEntity (str) {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
if (fieldProperties.LABEL) {
  try {
    labelContainer.innerHTML = unEntity(fieldProperties.LABEL)
  } catch { }
}
if (fieldProperties.HINT) {
  try {
    hintContainer.innerHTML = unEntity(fieldProperties.HINT)
  } catch { }
}

// Detect right-to-left languages
function isRTL (s) {
  var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF'
  var rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC'
  var rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']')

  return rtlDirCheck.test(s)
}

// TIME FUNCTIONS

function timer () {
  if (!complete) {
    timePassed = Date.now() - startTime
    timeLeft = timeStart - timePassed
  }

  if (timeLeft < 0) { // Timer ended
    blockInput()
    complete = true
    timeLeft = 0
    // timerDisp.innerHTML = String(Math.ceil(timeLeft / round))

    if ((currentAnswer == null) || (currentAnswer === '') || (Array.isArray(currentAnswer) && (currentAnswer.length === 0))) {
      setAnswer(missed)
    }
    setMetaData(0)
    if (autoAdvance) {
      goToNextField()
    }
  }
  setMetaData(timeLeft)

  if (dispTimer) {
    timerDisp.innerHTML = String(Math.ceil(timeLeft / round))
  }
}

function establishTimeLeft () { // This checks the current answer and leftover time, and either auto-advances if there is no time left, or establishes how much time is left.
  if ((leftoverTime == null) || (leftoverTime === '') || isNaN(leftoverTime)) {
    startTime = Date.now()
    timeLeft = timeStart
  } else {
    timeLeft = parseInt(leftoverTime)
    startTime = Date.now() - (timeStart - timeLeft)
  }
} // End establishTimeLeft

/* function checkComplete (cur) {
  if ((cur === '') || (cur == null) || (cur.length === 0)) {
    complete = false
  } else {
    complete = true
    blockInput()
    if (autoAdvance) {
      goToNextField()
    }
  }
} */

// Makes radio/check buttons unusable if that setting is turned on
function blockInput () {
  if (block) {
    for (const b of allButtons) {
      b.disabled = true
    }
  }
}
