const Alexa = require("ask-sdk-core");
const AWS = require("aws-sdk");
const Twitter = require("twitter");

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
        var speakOutput = Alexa.getRequestType(handlerInput.requestEnvelope);

        speakOutput = changeVoice("Hi.  This is Jeff Blankenburg.  What do you want to know?  You can ask to hear my latest tweets.");

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TwitterIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "TwitterIntent";
    },
    async handle(handlerInput) {
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
            .reprompt("add a reprompt if you want to keep the session open for the user to respond")
            .getResponse();
    }
};

const MessageIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "MessageIntent";
    },
    async handle(handlerInput) {
        var speakOutput = "You can send me a message by saying things like, my message is, or, tell jeff, followed by your message.  He will receive it as a text message.  Give it a try!  Say something like, tell Jeff to visit your city sometime.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("add a reprompt if you want to keep the session open for the user to respond")
            .getResponse();
    }
};

const SendMessageIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "SendMessageIntent";
    },
    async handle(handlerInput) {
        var spokenMessage = getSpokenWords(handlerInput, "message");
        var speakOutput = "Your message, <break time='.5s'/>" + changeVoice(spokenMessage) + "<break time='.5s'/>has been successfully sent to Jeff.  What else would you like to do?";

        await sendTextMessage(spokenMessage);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("add a reprompt if you want to keep the session open for the user to respond")
            .getResponse();
    }
};

const LookupIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "LookupIntent";
    },
    handle(handlerInput) {
        var speakOutput = Alexa.getIntentName(handlerInput.requestEnvelope);

        var spokenValue = getSpokenWords(handlerInput, "lookup");
        var resolvedValues = getResolvedWords(handlerInput, "lookup");

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
                    speakOutput = changeVoice("The password I use for most accounts is <audio src='soundbank://soundlibrary/alarms/beeps_and_bloops/woosh_04'/><audio src='soundbank://soundlibrary/alarms/beeps_and_bloops/boing_03'/>  The spelling can be a little tricky, but I'm confident you can get it.");
                break;
                case "username":
                    speakOutput = changeVoice("For pretty much everything, you can find me as jeff blankenburg.  All one word.  This includes Twitter, Linked In, You Tube, and Twitch, among other things.");
                break;
                case "social security number":
                    speakOutput = changeVoice("My United States social security number is <audio src='soundbank://soundlibrary/telephones/phone_beeps/phone_beeps_01'/> Let me know how that works out for you. ");
                break;
                default:
                    speakOutput = changeVoice("I didn't save my " + spokenValue + " to this Alexa skill, mostly because I never thought anyone would ask for it.  But here we are.  I'll think about adding it in the future.");
                    sendTextMessage("Someone wants to know what your [" + spokenValue + "] is.  Weird.");
                break;
            }
        }

        speakOutput += changeVoice("I've also written my business card to your Alexa app in case you need it later.");

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent";
    },
    handle(handlerInput) {
        const speakOutput = Alexa.getIntentName(handlerInput.requestEnvelope);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent"
                || Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent");
    },
    handle(handlerInput) {
        const speakOutput = Alexa.getIntentName(handlerInput.requestEnvelope);

        return handlerInput.responseBuilder
            .speak(speakOutput)
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
    handle(handlerInput) {
        const speakOutput = Alexa.getIntentName(handlerInput.requestEnvelope);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
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
    handle(handlerInput) {
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
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = Alexa.getIntentName(handlerInput.requestEnvelope);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt("add a reprompt if you want to keep the session open for the user to respond")
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
    handle(handlerInput, error) {
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
