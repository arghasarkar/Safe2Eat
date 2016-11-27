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
            //console.log("RATING: ---- " + getTakeawayRating(request.postcode, request.name));

            /* rating.success(function (data) {
             console.log("Received DATA: ----- " + data);
             });*/

            //var objest = rating;
            var string = rating.responseText;

            rating.done(function (data) {
                console.log(data);
                sendResponse({"rating": data});
            });
            return true;
            //sendResponse({"hello": "world"});


            //sendResponse({"rating": rating.success()});
            /*rating.success(function (data) {
             console.log(data);
             //var rating = data;
             sendResponse({"rating": data});
             });*/

        }

    }
);

function getTakeawayRating(postcode, name) {

    var FSA_URL = FSA_HOST + name + "/" + postcode + "/" + FSA_HOST_SUFFIX;
    console.log("URL: " + FSA_URL);

    return $.ajax({
        url: FSA_URL,
        success: function(data) {
            //console.log(data);
            data;
        },
        error: function () {
            console.log("Error!");
        }
    });
}