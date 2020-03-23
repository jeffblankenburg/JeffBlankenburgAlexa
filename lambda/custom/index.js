const Alexa = require("ask-sdk-core");
const AWS = require("aws-sdk");
const Twitter = require("twitter");
const https = require("https");

var twitter = new Twitter({
    consumer_key: process.env.twitter_api_key,
    consumer_secret: process.env.twitter_api_secret_key,
    access_token_key: process.env.twitter_access_token,
    access_token_secret: process.env.twitter_access_token_secret
});

var twitterHandle = "jeffblankenburg";
var firstName = "Jeff";

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getRequestType(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        var welcome = await getRandomSpeech("Welcome", locale);
        var actionQuery = await getRandomSpeech("ActionQuery", locale);

        var speakOutput = changeVoice(welcome + " " + actionQuery);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};

const TwitterIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "TwitterIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        var actionQuery = await getRandomSpeech("ActionQuery", locale);

        //TODO: Could we allow them to sort or filter based on likes, or retweets?
        var speakOutput = await new Promise((resolve, reject) => { twitter.get("statuses/user_timeline", {screen_name: twitterHandle, count:7, exclude_replies:true, include_rts:false, trim_user:true}, 
            function(error, tweets, response) {
                if(error) throw error;
                console.log("TWEETS = " + JSON.stringify(tweets));
                var tweetSpeech = createTweetSpeech(tweets);
                resolve(tweetSpeech);
            }
        )});
        console.log("SPEAK OUTPUT = " + JSON.stringify(speakOutput));

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};

const MessageIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "MessageIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        var actionQuery = await getRandomSpeech("ActionQuery", locale);
        var speakOutput = "You can send me a message by saying things like, my message is, or, tell " + firstName + ", followed by your message.  He will receive it as a text message.  Give it a try!  Say something like, tell " + firstName + " to visit your city sometime.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};

const SendMessageIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "SendMessageIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        var actionQuery = await getRandomSpeech("ActionQuery", locale);
        var spokenMessage = getSpokenWords(handlerInput, "message");
        var speakOutput = changeVoice("Your message, <break time='.5s'/>" + changeVoice(spokenMessage) + "<break time='.5s'/>has been successfully sent to " + firstName + ". " + actionQuery);

        await sendTextMessage(spokenMessage);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};

const LookupIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "LookupIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;

        var spokenValue = getSpokenWords(handlerInput, "lookup");
        var resolvedValues = getResolvedWords(handlerInput, "lookup");

        var actionQuery = await getRandomSpeech("ActionQuery", locale);

        var speakOutput = "";

        if (resolvedValues != undefined) {
            switch(resolvedValues[0].value.name.toLowerCase()) {
                case "phone number":
                    speakOutput = changeVoice("My phone number is <say-as interpret-as='telephone'>614-327-5066</say-as>. ");
                break;
                case "email address":
                    speakOutput = changeVoice("My email address is alexa at jeff blankenburg dot com. ");
                break;
                case "blood type":
                    speakOutput = changeVoice("I'm not sure why you would need to know my blood type, but I'm not even sure.  I'll ask my doctor at my next appointment. ");
                break;
                case "password":
                    speakOutput = changeVoice("The password I use for most accounts is <audio src='soundbank://soundlibrary/alarms/beeps_and_bloops/woosh_04'/><audio src='soundbank://soundlibrary/alarms/beeps_and_bloops/boing_03'/>  The spelling can be a little tricky, but I'm confident you can get it. ");
                break;
                case "username":
                    speakOutput = changeVoice("For pretty much everything, you can find me as jeff blankenburg.  All one word.  This includes Twitter, Linked In, You Tube, and Twitch, among other things. ");
                break;
                case "social security number":
                    speakOutput = changeVoice("My United States social security number is <audio src='soundbank://soundlibrary/telephones/phone_beeps/phone_beeps_01'/> Let me know how that works out for you. ");
                break;
                case "website":
                    speakOutput = changeVoice("I actually have two websites.  The website with all of my information on it is jeff blankenburg dot info.  I also have a blog, with articles on all sorts of subjects.  You can find that at jeff blankenburg dot com. ");
                break;
            }
        }
        else {
            speakOutput = changeVoice("I didn't save my " + spokenValue + " to this Alexa skill, mostly because I never thought anyone would ask for it.  But here we are.  I'll think about adding it in the future. ");
            sendTextMessage("Someone wants to know what your [" + spokenValue + "] is.  Weird.");
        }

        speakOutput += changeVoice("I've also written my business card to your Alexa app in case you need it later. " + actionQuery);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .withStandardCard("Jeff Blankenburg", "Phone: +1 (614) 327-5066\nEmail: alexa@jeffblankenburg.com\nTwitter: @jeffblankenburg\nTwitch: @jeffblankenburg", "https://s3.amazonaws.com/jeffblankenburg.alexa/images/jeffblankenburg.png", "https://s3.amazonaws.com/jeffblankenburg.alexa/images/jeffblankenburg.png")
            .getResponse();
    }
};

const FavoriteIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "FavoriteIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;

        var spokenValue = getSpokenWords(handlerInput, "favorite");
        var resolvedValues = getResolvedWords(handlerInput, "favorite");

        var actionQuery = await getRandomSpeech("ActionQuery", locale);

        var speakOutput = "";

        if (resolvedValues != undefined) {
            switch(resolvedValues[0].value.name.toLowerCase()) {
                case "color":
                    speakOutput = changeVoice("I am way too old to have a favorite color.  But it's orange. " + actionQuery);
                break;
                case "baseball team":
                    speakOutput = changeVoice("My favorite baseball team is the Cleveland Indians.  I'd really like to see them win a World Series in my lifetime. " + actionQuery);
                break;
                case "football team":
                    speakOutput = changeVoice("My favorite American football team is the Cleveland Browns.  My favorite soccer team is the Columbus Crew. " + actionQuery);
                break;
                case "country":
                    speakOutput = changeVoice("This is a tricky one.  Obviously, I'm from the United States, and I love my country first.  But I've visited dozens of other countries, and I have to say that I enjoyed India the most. " + actionQuery);
                break;
                case "city":
                    speakOutput = changeVoice("I live in Columbus, Ohio.  But my favorite city, without question, is New York City.  I go back several times a year. " + actionQuery);
                break;
                case "vacation spot":
                    speakOutput = changeVoice("I tend to like variety, so my favorite vacation spot is where ever I currently am.  That being said, I also went to the Outer Banks of North Carolina for 15 years straight, and loved every one of them. " + actionQuery);
                break;
                case "avenger":
                    speakOutput = changeVoice("I find that it varies.  I think I most like Tony Stark.  But Hulk, Spiderman, Deadpool, Star Lord, and Captain America are all high on my list. " + actionQuery);
                break;
                case "vehicle":
                    speakOutput = changeVoice("I currently drive a Jeep Wrangler. I honestly can't imagine driving anything else. I love being able to take my car apart in the summer.  No doors, no roof.  It's amazing. " + actionQuery);
                break;
                case "restaurant":
                    speakOutput = changeVoice("My favorite restaurant is Molly Woo's, in Columbus, Ohio.  But I actually love lots of restaurants.  My fast food restaurant is a drive-in burger place called Swenson's, which is also only located in Ohio. " + actionQuery);
                break;
            }
        }
        else {
            speakOutput = changeVoice("I don't currently have a favorite " + spokenValue + ".  At least, I didn't add it to this skill.  I'll think about what I should say, and add it here in the future. " + actionQuery);
            sendTextMessage("Someone wants to know what your favorite [" + spokenValue + "] is.  Weird.");
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};

const LampIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "LampIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        var actionQuery = await getRandomSpeech("ActionQuery", locale);
        var spokenValue = getSpokenWords(handlerInput, "color");
        changeLampColor(spokenValue);
        //https://maker.ifttt.com/trigger/alexa_lamp_red/with/key/dIZTMd3bCGd2VmZGbjGTGu6qjDDVhOiVsseiEQxm7vJ
        const speakOutput = changeVoice("The lamp has been set to " + spokenValue + ".  Tune in to twitch dot TV slash jeff blankenburg to see it change lyve on air! " + actionQuery);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        var actionQuery = await getRandomSpeech("ActionQuery", locale);
        var help = await getRandomSpeech("Help", locale);
        const speakOutput = changeVoice(help + " " + actionQuery);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent"
                || Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent");
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        const speakOutput = await getRandomSpeech("Goodbye", locale);

        return handlerInput.responseBuilder
            .speak(changeVoice(speakOutput))
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.FallbackIntent";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getIntentName(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        const actionQuery = await getRandomSpeech("ActionQuery", locale);
        const fallback = await getRandomSpeech("Fallback", locale);
        const speakOutput = changeVoice(fallback + " " + actionQuery);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "SessionEndedRequest";
    },
    async handle(handlerInput) {
        console.log("<=== " + Alexa.getRequestType(handlerInput.requestEnvelope).toUpperCase() + " HANDLER ===>");
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest";
    },
    async handle(handlerInput) {
        console.log("<=== INTENT REFLECTOR HANDLER ===>");
        const locale = handlerInput.requestEnvelope.request.locale;
        const actionQuery = await getRandomSpeech("ActionQuery", locale);
        const speakOutput = changeVoice(Alexa.getIntentName(handlerInput.requestEnvelope) + " " + actionQuery);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(changeVoice(actionQuery))
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    async handle(handlerInput, error) {
        console.log("<=== ERROR HANDLER ===>");
        const speakOutput = "<audio src='soundbank://soundlibrary/scifi/amzn_sfx_scifi_alarm_03'/>" + Alexa.getRequestType(handlerInput.requestEnvelope);
        console.log(`~~~~ Error handled: ${JSON.stringify(error.stack)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function createTweetSpeech(tweets) {
    var speech = "Here are " + firstName + "'s most recent tweets<break time='.5s'/>";
    for (var i = 0;i<tweets.length;i++) {
        var date = new Date(tweets[i].created_at);
        //"On " + date.toDateString + " at " + date.toTimeString + ",
        var tweet = tweets[i].text.split("http")
        speech += firstName + " tweeted <break time='.5s'/>" + changeVoice(tweet[0]);
    }
    console.log("TWEET SPEECH = " + speech);
    return speech;
}

function sendTextMessage(message) {
    console.log("SENDING TEXT MESSAGE. '" + message + "'");
    const SNS = new AWS.SNS();
    var parameters = {PhoneNumber: "+16143275066", Message: "FROM JEFF BLANKENBURG ALEXA:\n" + message};
    var promise = SNS.publish(parameters).promise();
    promise.then(function(data) {return true;}
    ).catch(function(err){return false;});
    console.log("DONE SENDING TEXT MESSAGE. '" + message + "'");
    return promise;
}

function changeVoice(speech) {
    return "<voice name='Joey'><prosody rate='fast'>" + speech + "</prosody></voice> "
}

function getSpokenWords(handlerInput, slot) {
    if (handlerInput.requestEnvelope
        && handlerInput.requestEnvelope.request
        && handlerInput.requestEnvelope.request.intent
        && handlerInput.requestEnvelope.request.intent.slots
        && handlerInput.requestEnvelope.request.intent.slots[slot]
        && handlerInput.requestEnvelope.request.intent.slots[slot].value)
        return handlerInput.requestEnvelope.request.intent.slots[slot].value;
    else return undefined;
}

function getResolvedWords(handlerInput, slot) {
    if (handlerInput.requestEnvelope
        && handlerInput.requestEnvelope.request
        && handlerInput.requestEnvelope.request.intent
        && handlerInput.requestEnvelope.request.intent.slots
        && handlerInput.requestEnvelope.request.intent.slots[slot]
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0]
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0].values
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0].values[0])
        return handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0].values
    else return undefined;
}

async function getRandomSpeech(table, locale) {
    const response = await httpGet(process.env.airtable_base_speech, "&filterByFormula=AND(IsDisabled%3DFALSE(),Locale%3D%22" + encodeURIComponent(locale) + "%22)", table);
    const speech = getRandomItem(response.records);
    console.log("RANDOM [" + table.toUpperCase() + "] = " + JSON.stringify(speech));
    return speech.fields.VoiceResponse;
}

function getRandomItem(items) {
    var random = getRandom(0, items.length-1);
    return items[random];
}

function getRandom(min, max){
    return Math.floor(Math.random() * (max-min+1)+min);
}

function httpGet(base, filter, table = "Data"){
    var options = { host: "api.airtable.com", port: 443, path: "/v0/" + base + "/" + table + "?api_key=" + process.env.airtable_api_key + filter, method: "GET"};
    console.log("FULL PATH = http://" + options.host + options.path);
    return new Promise(((resolve, reject) => { const request = https.request(options, (response) => { response.setEncoding("utf8");let returnData = "";
        if (response.statusCode < 200 || response.statusCode >= 300) { return reject(new Error(`${response.statusCode}: ${response.req.getHeader("host")} ${response.req.path}`));}
        response.on("data", (chunk) => { returnData += chunk; });
        response.on("end", () => { resolve(JSON.parse(returnData)); });
        response.on("error", (error) => { reject(error);});});
        request.end();
    }));
}

function changeLampColor(color) {

//const data = JSON.stringify({
//  todo: 'Buy the milk'
//})

const options = {
  hostname: "maker.ifttt.com",
  port: 443,
  path: "/trigger/alexa_lamp_" + color + """/with/key/dIZTMd3bCGd2VmZGbjGTGu6qjDDVhOiVsseiEQxm7vJ",
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

//req.write(data)
req.end()
}

const RequestLog = {
    async process(handlerInput) {
        console.log("REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
    }
};
  
const ResponseLog = {
    process(handlerInput) {
        console.log("RESPONSE BUILDER = " + JSON.stringify(handlerInput.responseBuilder.getResponse()));   
    }
};
/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        TwitterIntentHandler,
        MessageIntentHandler,
        SendMessageIntentHandler,
        LookupIntentHandler,
        LampIntentHandler,
        FavoriteIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(RequestLog)
    .addResponseInterceptors(ResponseLog)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
