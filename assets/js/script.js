const numberOfQuestions = 3;  // number of questions per quiz
const numberOfOtherQuotes = 3;  // number of other (non-Kanye) quotes per question
const quoteCharacterCap = 80;  // maximum number of characters any quote can have (for presentation)

var currentQuestion = 0;  // keeps track of which question number the player is on

var questionLoadInterval;
const waitForQuestionLoadTime = 100;  // number of milliseconds to wait before checking if quotes are loaded

var otherQuotes = [];  // contains the normal quotes that will be used in the quiz
var kanyeQuotes = [];  // contains the Kanye West quotes that will be used in the quiz


class Quote {
    constructor(text, author) {
        this.text = text;
        this.author = author;
    }
}


function hideElement(element) {
    $(element).css("display", "none");
}


// returns a random integer from 0 to max
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}


// returns true if a quote is NOT already in given array
function quoteNotIncluded(quoteChecked, quotesArray) {
    if (quotesArray.length === 0) { return true; }

    return quotesArray.find(quote => quote.text === quoteChecked) === undefined;
}


// filter out quotes that exceed character maximum, also given an array of quotes to not include
function filterQuotes(quotes, dontIncludeArray) {
    const filteredQuotes = [];

    for (const quote of quotes) {
        if (quote.quoteText.length <= quoteCharacterCap && quoteNotIncluded(quote.quoteText, dontIncludeArray)) { 
            const quoteObject = new Quote(quote.quoteText, quote.quoteAuthor);
            filteredQuotes.push(quoteObject);
        }
    }

    return filteredQuotes;
}


// filters a single quote given a Quote and array of quotes to not include
function filterQuote(quote, dontIncludeArray) {
    return filterQuotes([{
        quoteText: quote.text,
        quoteAuthor: quote.author
    }], dontIncludeArray);
}


// fetches all non-Kanye quotes needed for an entire quiz
function fetchOtherQuotes() {
    const count = 10;
    fetch(`https://quote-garden.onrender.com/api/v3/quotes/random?count=${count}`)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // console.log(data);
            otherQuotes = otherQuotes.concat(filterQuotes(data.data, otherQuotes));

            // fetch more quotes if there aren't enough to fill all questions
            if (otherQuotes.length < numberOfOtherQuotes * (numberOfQuestions - currentQuestion)) { 
                fetchOtherQuotes();
            }

            else {
                console.log("Other Quotes:", otherQuotes);
            }
        });
}


// fetches all Kanye quotes needed for an entire quiz
function fetchKanyeQuotes() {
    fetch('https://api.kanye.rest')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            var quote = data.quote;

            // add punctuation to end of quote so it fits in better
            const endsWithPunctuation = quote.endsWith('.') || quote.endsWith('!') || quote.endsWith('!');
            if (!endsWithPunctuation) { quote = quote + "."; }

            // make quote object and add it to Kanye quotes array
            const quoteObject = new Quote(quote, 'Kanye West');
            kanyeQuotes = kanyeQuotes.concat(filterQuote(quoteObject, kanyeQuotes));
            
            
            // fetch more quotes if there aren't enough to fill all questions
            if (kanyeQuotes.length < numberOfQuestions - currentQuestion) {
                fetchKanyeQuotes();
            }

            else {
                console.log("Kanye Quotes:", kanyeQuotes);
            }
        });
}


// returns an array of a new question set, removing used quotes from their respective arrays
function generateQuestionSetArray() {
    // get and delete a random Kanye quote
    const kanyeQuoteIndex = getRandomInt(kanyeQuotes.length);
    const kanyeQuote = kanyeQuotes[kanyeQuoteIndex];
    kanyeQuotes.splice(kanyeQuoteIndex, 1);

    // add Kanye quote to question set array
    const questionSet = [kanyeQuote];

    // get and delete a few other quotes
    for (var i = 0; i < numberOfOtherQuotes; i++) {
        const otherQuoteIndex = getRandomInt(otherQuotes.length);
        const otherQuote = otherQuotes[otherQuoteIndex];
        otherQuotes.splice(otherQuoteIndex, 1);

        questionSet.push(otherQuote);
    }
    
    // scramble question set array
    const scrambledQuestionSet = [];
    while (questionSet.length > 0) {
        const randomIndex = getRandomInt(questionSet.length);
        const randomQuote = questionSet[randomIndex];
        questionSet.splice(randomIndex, 1);

        scrambledQuestionSet.push(randomQuote);
    }

    return scrambledQuestionSet;
}


// generates a question set in the DOM
function generateQuestionSet(questionSet) {
    console.log("Question Set:", questionSet);

    for (quote of questionSet) {
        $('body').append(`<p>${quote.text}</p>`);
        $('body').append(`<p>    - ${quote.author}</p>`);

        // generate heart button
        // const saveButton = $('<button>');
        // saveButton.text('Save');
        // saveButton.on('click', handleSaveQuoteButtonClick);
        // $('body').append(saveButton);
    }
}


function startNewQuestion() {
    // if enough quotes are loaded for 1 new question
    const enoughQuotesLoaded = (kanyeQuotes.length >= 1) && (otherQuotes.length >= numberOfOtherQuotes);
    if (enoughQuotesLoaded) {
        // stop waiting for loading
        if (questionLoadInterval) { 
            clearInterval(questionLoadInterval);
            questionLoadInterval = null;
        }

        // generate a new question set
        const questionSet = generateQuestionSetArray();
        generateQuestionSet(questionSet);
        currentQuestion++;
    }

    // if more time is needed to load quotes and waiting has not begun
    else if (!questionLoadInterval) {
        // begin rechecking if quotes are loaded on interval
        questionLoadInterval = setInterval(startNewQuestion, waitForQuestionLoadTime);
    }

    else {
        console.log("Wait for load...");
    }
}


// begins a new game
function startGame() {
    currentQuestion = 0;
    startNewQuestion();

    hideElement($('#homepage'));
}


// begins fetching quotes from APIs
function beginFetchingQuotes() {
    fetchOtherQuotes();
    fetchKanyeQuotes();
}


// executed one time once page loads
function init() {
    beginFetchingQuotes();

    $('#playButton').on("click", startGame);
}


$(init);