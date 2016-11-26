var jq = document.createElement("script");

jq.addEventListener("load", init); // pass my hoisted function
jq.src = "js/vendors/jquery.js";
document.querySelector("head").appendChild(jq);

function init() {
    FSA_HOST = "http://ratings.food.gov.uk/search/";
    FSA_HOST_SUFFIX = "json";
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
        "from a content script:" + sender.tab.url :
            "from the extension");
        if (request) {
            var rating = getTakeawayRating(request.postcode, request.name, function (data) {
                console.log(data);
                return data;
            });
            sendResponse({"rating": rating});
        }

    }
);

function getTakeawayRating(postcode, name, callback) {

    var FSA_URL = FSA_HOST + name + "/" + postcode + "/" + FSA_HOST_SUFFIX;
    console.log("URL: " + FSA_URL);

    var ratingJson = $.ajax({
        url: FSA_URL,
        success: function(data) {
            console.log(data);
            callback(data);
        },
        error: function () {
            console.log("Error!");
        }
    });
}