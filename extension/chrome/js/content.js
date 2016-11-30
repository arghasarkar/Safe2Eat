const UNRATED_VALUE = 6;

const JUST_EAT_SEARCH_LIST = "o-tile c-restaurant";
const JUST_EAT_INDIVIDUAL_NAME = "name";
const JUST_EAT_INDIVIDUAL_POSTCODE = "postcode";
const JUST_EAT_INDIVIDUAL_PLACEHOLDER = "ratings";

IS_JE = true;

init();

urls = [
    chrome.extension.getURL("images/fhrs_0_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_1_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_2_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_3_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_4_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_5_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_awaitinginspection_en-gb.jpg")
];

function init() {

    takeaways = []

    var url = window.location.href;
    if (url.includes("just")) {
        // CODE FOR JUST EAT
        console.log("Just eat");
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
                console.log(takeaways[res]);
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
        console.log("Hungry house");

        var postcode = $( "span[itemprop='postalCode']" )[0].innerText.trim();
        var takeawayName = document.getElementsByClassName("regular current")[0].innerText.trim();
        var rating = 0;

        takeaways.push(postcode, takeawayName, rating);

        console.log(takeaways);
        getTakeawayRatingMP(takeaways, 0);
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
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            handleRes(jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue);
        } else {
            handleRes(6);
        }
        return true;
    });

    var handleRes = function (rating) {
        setJustEatIndividualRating(rating);
        console.log(rating);
    }

    return true;
}

/**
 * JUST EAT
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
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            if (IS_JE) {
                insertRatingImageSearchList(index, '<img src="' + urls[jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue] + '" />');
            } else {
                insertRatingImageHH('<img src="' + urls[jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue] + '" />');
            }
        } else {
            if (IS_JE) {
                insertRatingImageSearchList(index, '<img src="' + urls[6] + '" />');
            } else {
                insertRatingImageHH('<img src="' + urls[6] + '" />');
            }
        }
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
} else {

}
// HUNGRY HOUSE
function insertRatingImageHH(rating) {
    console.log("Rating: " + rating);
    $( "<p style='float: right;margin-top: -15px;'>" + rating + "</p>" ).insertAfter($("#restMainInfoWrapper").children().last());
}

function getJustEatIndividualName() {
    return document.getElementsByClassName(JUST_EAT_INDIVIDUAL_NAME)[0].textContent;
}
function getJustEatIndividualPostcode() {
    return document.getElementById(JUST_EAT_INDIVIDUAL_POSTCODE).innerText;
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

