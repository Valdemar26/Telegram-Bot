var TelegramBot = require('node-telegram-bot-api');
var http = require('http');

var token = 'YOUR_INDIVIDUAL_TOKEN';
var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var options = {
    host: "www.bank.gov.ua",
    port: 80,
    path: "/NBUStatService/v1/statdirectory/exchange"
};

var content = "";

bot.getMe().then(function(me)
{
    console.log('Hello! My name is %s!', me.first_name);
    console.log('My id is %s.', me.id);
    console.log('And my username is @%s.', me.username);
});

bot.on('text', function(msg)
{
    var messageChatId = msg.chat.id;
    var messageText = msg.text;
    var messageDate = msg.date;
    var messageUser = msg.from.username;

    if (messageText.indexOf('/currency') === 0) {
        updateGlobalCurrencyList(messageChatId);
    }
});

function sendMessageByBot(aChatId, aMessage)
{
    bot.sendMessage(aChatId, aMessage, { caption: 'I\'m a cute bot!' });
}

function updateGlobalCurrencyList(aMessageChatId)
{
    var req = http.request(options, function(res) {
        res.setEncoding("utf8");
        res.on("data", function(chunk) {
            content += chunk;
        });
        res.on("end", function() {
            sendMessageByBot(aMessageChatId, shittyParseXML(content));
        });
    });
    req.end();
}

function generateBotAnswer(aCurrencyList)
{
    var currencyTableNBU = "Курс валют НБУ:\n";
    currencyTableNBU += '1 USD = ' + aCurrencyList.USD + ' ' + 'UAH' + ';\n';
    currencyTableNBU += '1 EUR = ' + aCurrencyList.EUR + ' ' + 'UAH' + ';\n';

    return currencyTableNBU;
}

function shittyParseXML(aAllXml) {
    var currencyList = {
        'USD': 0.0,
        'EUR': 0.0
    };

    currencyList.USD = getCurrentValue('840', aAllXml); // 840 is code for USD
    currencyList.EUR = getCurrentValue('978', aAllXml); // 978 is code for EUR


    return generateBotAnswer(currencyList);
}

function getCurrentValue(aCurrency, aString)
{
    //var nominal = parseFloat(replaceCommasByDots(getStringBelow(aString.indexOf(aCurrency), 1, aString)));
    var value = parseFloat(replaceCommasByDots(getStringBelow(aString.indexOf(aCurrency), 2, aString)));

    return (value).toFixed(4);
}

function removeTags(aString)
{
    return aString.replace(/(<([^>]+)>)/ig, '');
}

function getStringBelow(aStart, aBelow, aString)
{
    var textSize = aString.length;
    var countOfLineEndings = 0;
    var getLineWith = 0;

    for (var i = aStart; i < textSize; ++i) {
        if (countOfLineEndings === aBelow) {
            getLineWith = i;
            break;
        }
        if (aString[i] === '\n') {
            countOfLineEndings++;
        }
    }

    return getLineFromXml(getLineWith, aString);
}

function replaceCommasByDots(aString)
{
    return aString.replace(',', '.');
}

function getLineFromXml(aStart, aString)
{
    var textSize = aString.length;
    var targetString = '';
    for (var i = aStart; i < textSize; ++i) {
        if (aString[i] === '\n') {
            break;
        }
        targetString += aString[i];
    }

    return removeTags(targetString.trim());
}
