const UNRATED_VALUE = 6;

const JUST_EAT_SEARCH_LIST = "o-tile c-restaurant";
const JUST_EAT_INDIVIDUAL_NAME = "name";
const JUST_EAT_INDIVIDUAL_POSTCODE = "postcode";
const JUST_EAT_INDIVIDUAL_PLACEHOLDER = "ratings";

const HUNGRY_HOUSE_SEARCH_LIST = "restsDeliveryInfo";

takeaways = [];
IS_JE = true;

urls = [
    chrome.extension.getURL("images/fhrs_0_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_1_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_2_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_3_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_4_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_5_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_awaitinginspection_en-gb.jpg")
];

window.addEventListener ("load", init, true);

function init() {

    var url = window.location.href;
    if (url.includes("just")) {
        // CODE FOR JUST EAT
        /**
         * Checking to see if this is in a list or an individual restaurant
         */
        if (document.getElementsByClassName("name").length <= 0) {
            // List
            $( "div" ).filter(function( index ) {
                return $( this ).attr( "class" ) == JUST_EAT_SEARCH_LIST;
            }).each(function( index ) {
                var postcode =  $( this ).find(
                    "[data-ft='restaurantDetailsAddress']"
                ).html();

                postcode = postcode.split(", ");
                postcode = postcode[postcode.length - 1];

                var rating = UNRATED_VALUE;

                takeaways.push([
                    postcode,
                    $( this ).find(
                        "[data-ft='restaurantDetailsName']"
                    ).html(),
                    rating
                ]);
            });

            for (var res in takeaways) {
                var rating = getTakeawayRatingMP(takeaways[res], res);
            }
        } else {
            // Individual restaurant
            takeaways.push([
                getJustEatIndividualPostcode(),
                getJustEatIndividualName(),
                UNRATED_VALUE
            ]);
            _new_getTakeawayRatingMP(takeaways[0]);
        }

    } else {
        // CODE FOR HUNGRY HOUSE
        IS_JE = false;

        /**
         * The URL for the search listing on HungryHouse has "/takeaway" if the search results are being displayed.
         * However, when browsing the contents of an individual take away, the URL does not contain this. Use this check
         * to see if the search results are being viewed or an individual takeaway.
         */
        if (window.location.href.includes("/takeaway")) {

            var takeawayLinks = document.getElementsByClassName("restPageLink restsRestStatus");

            for (var i = 0; i < takeawayLinks.length; i++) {
                var takeawayUrl = takeawayLinks[i].href;
                var takeawayName = takeawayLinks[i].title;
                getHHSearchPostcode(takeawayName, takeawayUrl, i);
            }

        } else {

            var postcode = document.getElementsByClassName("address")[0].childNodes[5].innerText.trim();
            var takeawayName = document.getElementsByClassName("regular current")[0].innerText.trim();
            var rating = 0;

            takeaways.push(postcode, takeawayName, rating);
            getTakeawayRatingMP(takeaways, 0);
        }
    }
}

function _new_getTakeawayRatingMP(takeaway) {
    chrome.runtime.sendMessage({"postcode": takeaway[0], "name": takeaway[1]}, function(response) {
        jsonResponse = JSON.parse(response.rating);

        /**
         * Call a function here to return the rating
         * Data: jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail <--  Rating exists
         * Else: The rating has not been found.
         */
        var rating = 6;
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            if (jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.length > 1) {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail[0].RatingValue;
            } else {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue;
            }
        }
        handleRes(rating);
        return true;
    });

    var handleRes = function (rating) {
        setJustEatIndividualRating(rating);
    };

    return true;
}

/**
 * JUST EAT rating and Hungryhouse's individual rating
 * @param takeaway
 * @param index
 */
function getTakeawayRatingMP(takeaway, index) {
    var takeawayPostcode = takeaway[0];
    var takeawayName = takeaway[1];

    chrome.runtime.sendMessage({"postcode": takeawayPostcode, "name": takeawayName}, function(response) {
        jsonResponse = JSON.parse(response.rating);
        /**
         * Call a function here to insert the RATING IMAGE.
         * Index: index
         * Data: jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail
         * eg --> somefunction(index, jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.ratingValue)
         */
        var rating = 6;
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            if (jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.length > 1) {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail[0].RatingValue
            } else {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue;
            }
        }
        if (IS_JE) {
            insertRatingImageSearchList(index, '<img src="' + urls[rating] + '" />');
        } else {
            insertRatingImageHH('<img src="' + urls[rating] + '" />');
        }
        /*else {
            if (IS_JE) {
                insertRatingImageSearchList(index, '<img src="' + urls[6] + '" />');
            } else {
                insertRatingImageHH('<img src="' + urls[6] + '" />');
            }
        }*/
    });
}

/**
 * JUST EAT
 * @param index
 * @param elementß
 * @returns {jQuery}
 */
if (IS_JE) {
    jQuery.fn.insertAt = function(index, element) {
        var lastIndex = this.children().size();
        if (index < 0) {
            index = Math.max(0, lastIndex + 1 + index)
        }
        this.append(element);
        if (index < lastIndex) {
            this.children().eq(index).before(this.children().last())
        }
        return this;
    };

    function insertRatingImageSearchList(index, rating) {
        //Quite possibly the most disgusting javascript selector I've ever written.
        var $detailsDiv = $("div").filter(function( index ) {
            return $( this ).attr( "class" ) == "o-tile c-restaurant";
        }).eq(index).eq(0).children().eq(0).children().eq(2).children().eq(1);
        $( "<p style='float: right;margin-top: -40px;margin-right: 10px;padding-top: 20px;'>" + rating + "</p>" ).insertAfter($detailsDiv)
    }

    insertRatingImageSearchList(1, "");
}

// HUNGRY HOUSE
function insertRatingImageHH(rating) {
    $( "<p style='float: right;margin-top: -15px;'>" + rating + "</p>" ).insertAfter($("#restMainInfoWrapper").children().last());
}

function getJustEatIndividualName() {
    return document.getElementsByClassName(JUST_EAT_INDIVIDUAL_NAME)[0].textContent;
}
function getJustEatIndividualPostcode() {
    return document.getElementById(JUST_EAT_INDIVIDUAL_POSTCODE).innerText;
}

/**
 * Sets / Injects the FSA rating for the restaurant given the rating and its index in the page
 * @param rating
 * @param index
 */
function setHungryHouseSearchListRating(rating, index) {
    var img = $('<img />', {
        src: urls[rating],
        alt: 'Food standards agency has given this takeaway a rating of ' + rating + '.',
    });
    img.css("float", "right");
    img.css("margin-right", "180px");
    img.css("margin-top", "-15px");
    img.appendTo($("." + HUNGRY_HOUSE_SEARCH_LIST)[index]);
}

/**
 * Inserts the HTML rating into next to the individual take away on just-eat.com
 * @param rating
 */
function setJustEatIndividualRating(rating) {
    var img = $('<img />', {
        src: urls[rating],
        alt: 'Food standards agency has given this takeaway a rating of ' + rating + '.',
    });
    img.css("float", "right");
    img.css("margin-top", "-30px");
    img.appendTo($("." + JUST_EAT_INDIVIDUAL_PLACEHOLDER));
}

function getHHSearchPostcode(takeawayName, url, indexOfTakewayOnList) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            var _html = $(this.responseText);
            var _address = $(".address", _html);
            var _postCode = $.trim(_address[0].childNodes[5].innerText);

            for (var i = 0; i < _address[0].childNodes.length; i++) {
                if (valid_postcode($.trim(_address[0].childNodes[i].innerText))) {
                    _postCode = $.trim(_address[0].childNodes[i].innerText);
                    break;
                }
            }

            // Get the rating from the API using the postcode and the name of the takeaway
            getAndInsertHHSearchRating(takeawayName, _postCode, indexOfTakewayOnList);
        }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

/**
 * Uses the takeaway name and the postcode to get the FSA rating for the given HH takeaway
 * @param takeawayName
 * @param takeawayPostcode
 * @param index
 */
function getAndInsertHHSearchRating(takeawayName, takeawayPostcode, index) {
    chrome.runtime.sendMessage({"postcode": takeawayPostcode, "name": takeawayName}, function(response) {
        var jsonResponse = JSON.parse(response.rating);
        var rating = 6;
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            if (jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.length > 1) {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail[0].RatingValue;
            } else {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue;
            }
            // Inject the rating
            setHungryHouseSearchListRating(rating, index);
        } else {
            setHungryHouseSearchListRating(6, index);
        }
    });
}

function valid_postcode(postcode) {
    postcode = postcode.replace(/\s/g, "");
    var regex = /^[A-Z]{1,2}[0-9]{1,2} ?[0-9][A-Z]{2}$/i;
    return regex.test(postcode);
}


