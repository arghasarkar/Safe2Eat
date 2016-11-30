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

        if (request) {
            console.log("This is executing");
            var rating = getTakeawayRating(request.postcode, request.name);

            /**
             * When the rating has been fetched, send the response with the content script to inject the Rating
             */
            rating.done(function (data) {
                console.log(data);
                sendResponse({"rating": data});
            });
            // Returns true so that the rating ajax can be sent off asynchronously
            return true;
        }

    }
);

function getTakeawayRating(postcode, name) {

    var FSA_URL = FSA_HOST + name + "/" + postcode + "/" + FSA_HOST_SUFFIX;
    console.log("URL: " + FSA_URL);

    return $.ajax({
        url: FSA_URL,
        success: function(data) {
            data;
        },
        error: function () {
            console.log("Error!");
        }
    });
}