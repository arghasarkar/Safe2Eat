var jq = document.createElement("script");

jq.addEventListener("load", init); // pass my hoisted function
jq.src = "js/vendors/jquery.js";
document.querySelector("head").appendChild(jq);

function init() {
    FSA_HOST = "http://ratings.food.gov.uk/search/";
    FSA_HOST_SUFFIX = "json";
}

