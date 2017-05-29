const UNRATED_VALUE = 6;

const JUST_EAT = "JustEat";
const JUST_EAT_FQDN = "just-eat.co.uk";
const JUST_EAT_SEARCH_LIST = "o-tile c-restaurant";
const JUST_EAT_INDIVIDUAL_NAME = "name";
const JUST_EAT_INDIVIDUAL_POSTCODE = "postcode";
const JUST_EAT_INDIVIDUAL_PLACEHOLDER = "ratings";

const HUNGRY_HOUSE = "HungryHouse";
const HUNGRY_HOUSE_FQDN = "hungryhouse.co.uk";
const HUNGRY_HOUSE_SEARCH_LIST = "restsDeliveryInfo";

const DELIVEROO = "Deliveroo";
const DELIVEROO_FQDN = "deliveroo.co.uk";
const DELIVEROO_SEARCH_LIST_CLASS = "restaurant-index-page--grid-row";
const DELIVEROO_INDIVIDUAL_CLASS = "address";
const DELIVEROO_INDIVIDUAL_JSON_CLASS = "js-react-on-rails-component";
const DELIVEROO_INDIVIDUAL_PLACEHOLDER_CLASS = "restaurant__name";

const FSA_LINK_URL_PREFIX = "http://ratings.food.gov.uk/enhanced-search/en-GB/";
const FSA_LINK_URL_POSTFIX = "Relevance/0/%5E/%5E/0/1/10";

let takeaways = [];

// Vendor name: JustEat, HungryHouse or Deliveroo
const VENDOR = getVendorName();

let urls = [
    chrome.extension.getURL("images/fhrs_0_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_1_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_2_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_3_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_4_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_5_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_awaitinginspection_en-gb.jpg")
];

// Run the initialisation function
//document.addEventListener ("load", init, true);
$(document).ready(() => {
    init();
});


/**
 * Initialisation function. Kicks off the process of detecting the Vendor website and getting the hygiene ratings.
 */
function init() {

    console.log("Running init.");

    switch (VENDOR) {

        case JUST_EAT: {
            /**
             * Initialisation for Just Eat
             * Checking to see if this is in a list or an individual restaurant
             */
            if (document.getElementsByClassName("name").length <= 0) {
                // List
                $( "div" ).filter(function( index ) {
                    return $( this ).attr( "class" ) == JUST_EAT_SEARCH_LIST;
                }).each(function( index ) {
                    let postcode =  $( this ).find(
                        "[data-ft='restaurantDetailsAddress']"
                    ).html();

                    postcode = postcode.split(", ");
                    postcode = postcode[postcode.length - 1];

                    let rating = UNRATED_VALUE;

                    takeaways.push([
                        postcode,
                        $( this ).find(
                            "[data-ft='restaurantDetailsName']"
                        ).html(),
                        rating
                    ]);
                });

                for (let res in takeaways) {
                    let rating = getTakeawayRatingMP(takeaways[res], res);
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

            break;
        }

        case HUNGRY_HOUSE: {
            // CODE FOR HUNGRY HOUSE
            /**
             * The URL for the search listing on HungryHouse has "/takeaway" if the search results are being displayed.
             * However, when browsing the contents of an individual take away, the URL does not contain this. Use this check
             * to see if the search results are being viewed or an individual takeaway.
             */
            if (window.location.href.includes("/takeaway")) {

                let takeawayLinks = document.getElementsByClassName("restPageLink restsRestStatus");

                for (let i = 0; i < takeawayLinks.length; i++) {
                    let takeawayUrl = takeawayLinks[i].href;
                    let takeawayName = takeawayLinks[i].title;
                    getHHSearchPostcode(takeawayName, takeawayUrl, i);
                }

            } else {

                let postcode = document.getElementsByClassName("address")[0].childNodes[5].innerText.trim();
                let takeawayName = document.getElementsByClassName("regular current")[0].innerText.trim();
                let rating = 0;

                takeaways.push(postcode, takeawayName, rating);
                getTakeawayRatingMP(takeaways, 0);
            }
            break;
        }

        case DELIVEROO: {
            console.log(DELIVEROO);

            if (document.getElementsByClassName(DELIVEROO_SEARCH_LIST_CLASS).length > 0) {
                console.log("Deliveroo list");
            } else if (document.getElementsByClassName(DELIVEROO_INDIVIDUAL_CLASS).length > 0) {
                console.log("Deliveroo individual");
                getDeliverooIndividualRating();

            } else {
                console.log("Deliveroo - unable to establish state");
            }

            break;
        }

        default: {
            console.log("Not a supported website");
        }
    }

}

/**
 * Determines which website is being visited between: HungryHouse, JustEat or Deliveroo
 */
function getVendorName() {
    let url = window.location.href;

    if (url.includes(JUST_EAT_FQDN)) {
        return JUST_EAT;
    }

    if (url.includes(HUNGRY_HOUSE_FQDN)) {
        return HUNGRY_HOUSE;
    }

    if (url.includes(DELIVEROO_FQDN)) {
        return DELIVEROO;
    }
}

function _new_getTakeawayRatingMP(takeaway) {
    chrome.runtime.sendMessage({"postcode": takeaway[0], "name": takeaway[1]}, function(response) {
        let jsonResponse = JSON.parse(response.rating);

        /**
         * Call a function here to return the rating
         * Data: jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail <--  Rating exists
         * Else: The rating has not been found.
         */
        let rating = 6;
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            if (jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.length > 1) {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail[0].RatingValue;
            } else {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue;
            }
        }
        handleRes(rating, takeaway[1], takeaway[0]);
        return true;
    });

    let handleRes = function (rating, takeawayName, takeawayPostcode) {
        setJustEatIndividualRating(rating, takeawayName, takeawayPostcode);
    };

    return true;
}

/**
 * JUST EAT, Hungryhouse and Deliveroo individual rating
 * @param takeaway
 * @param index
 */
function getTakeawayRatingMP(takeaway, index) {
    let takeawayPostcode = takeaway[0];
    let takeawayName = takeaway[1];

    chrome.runtime.sendMessage({"postcode": takeawayPostcode, "name": takeawayName}, function(response) {
        let jsonResponse = JSON.parse(response.rating);
        /**
         * Call a function here to insert the RATING IMAGE.
         * Index: index
         * Data: jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail
         * eg --> somefunction(index, jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.ratingValue)
         */
        let rating = 6;
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            if (jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.length > 1) {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail[0].RatingValue
            } else {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue;
            }
        }
        if (VENDOR === JUST_EAT) {
            insertRatingImageSearchList(index, '<img src="' + urls[rating] + '" />', takeawayName, takeawayPostcode);
        } else if (VENDOR === HUNGRY_HOUSE) {
            insertRatingImageHH('<img src="' + urls[rating] + '" />', takeawayName, takeawayPostcode);
        } else if (VENDOR === DELIVEROO) {
            getDeliverooIndividualRating();
        }
    });
}

/**
 * This function will insert the FSA rating for an individual Deliveroo listing
 */
function getDeliverooIndividualRating() {
    let takeaway = JSON.parse(document.getElementsByClassName(DELIVEROO_INDIVIDUAL_JSON_CLASS)[0].innerText).restaurant;
    let takeawayPostcode = postcodeWithSpace(takeaway.post_code);
    let takeawayName = takeaway.name;

    chrome.runtime.sendMessage({"postcode": takeawayPostcode, "name": takeawayName}, (response) => {
        let jsonResponse = JSON.parse(response.rating);
        let rating = 6;

        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            // Rating has been found
            if (jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.length > 1) {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail[0].RatingValue
            } else {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue;
            }
        }

        setRatingImageDeliverooIndividual(takeawayName, takeawayPostcode, rating);
    });
}

function setRatingImageDeliverooIndividual(takeawayName, takeawayPostcode, rating) {
    let parentDiv = document.getElementsByClassName(DELIVEROO_INDIVIDUAL_PLACEHOLDER_CLASS)[0];
    let image =
        `<a href='${generateFsaLinkUrl(takeawayName, takeawayPostcode)}'>
             <img style='margin-left: 540px; margin-top: -40px; width: 120px' src='${urls[rating]}' alt='Hygiene rating of ${rating}'>
         </a>`;

    let holdingNode = document.createElement("div");
    holdingNode.style.marginTop = "-20px";
    holdingNode.innerHTML = image;
    insertAfterNode(holdingNode, parentDiv)
}

/**
 * JUST EAT
 * @param index
 * @param elementß
 * @returns {jQuery}
 */
if (VENDOR === JUST_EAT) {
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

    function insertRatingImageSearchList(index, rating, takeawayName, takeawayPostcode) {
        //Quite possibly the most disgusting javascript selector I've ever written.
        let $detailsDiv = $("div").filter(function( index ) {
            return $( this ).attr( "class" ) == JUST_EAT_SEARCH_LIST;
        }).eq(index).eq(0).children().eq(0).children().eq(2).children().eq(1);

        let ratingImageHolder = "<p>" + rating + "</p>";
        let ratingImageLink = "<a style='float: right;margin-top: -40px;margin-right: 10px;padding-top: 20px;' " +
            "href='" + generateFsaLinkUrl(takeawayName, takeawayPostcode) + "'>" + ratingImageHolder + "</a>";

        $(ratingImageLink).insertAfter($detailsDiv)
    }

    insertRatingImageSearchList(1, "");
}

// HUNGRY HOUSE
function insertRatingImageHH(rating, takeawayName, takeawayPostcode) {
    let ratingBody = "<p style='float: right;margin-top: -15px; margin-right: -15px;'>" + rating + "</p>";
    let fsaLink = generateFsaLinkUrl(takeawayName, takeawayPostcode);

    $( "<a target='_blank' href='" + fsaLink + "'> " + ratingBody + "</a>" ).insertAfter($("#restMainInfoWrapper").children().last());
    document.getElementsByClassName("restRatingIn")[0].style.width = "99px";
    document.getElementsByClassName("restDetailsBox")[0].style.width = "180px";
    document.getElementsByClassName("restOpeningHours")[0].style.width = "127px";
}

function getJustEatIndividualName() {
    return document.getElementsByClassName(JUST_EAT_INDIVIDUAL_NAME)[0].textContent;
}
function getJustEatIndividualPostcode() {
    return document.getElementById(JUST_EAT_INDIVIDUAL_POSTCODE).innerText;
}

/**
 * Sets / Injects the FSA rating for the restaurant given the rating and its index in the page for HungryHouse
 * @param rating
 * @param index
 * @param takeawayName
 * @param takeawayPostcode
 */
function setHungryHouseSearchListRating(rating, index, takeawayName, takeawayPostcode) {
    let ratingImg = "<img src='" + urls[rating] + "' alt='Hygiene rating of " + rating + "' />";

    let FsaLink = "<a style='float: right; margin-right: 180px; margin-top: -15px' href='"
        + generateFsaLinkUrl(takeawayName, takeawayPostcode) + "'>" + ratingImg + " </a>";

    document.getElementsByClassName(HUNGRY_HOUSE_SEARCH_LIST)[index].innerHTML += FsaLink;
}

/**
 * Inserts the HTML rating into next to the individual take away on just-eat.com
 * @param rating
 */
function setJustEatIndividualRating(rating, takeawayName, takeawayPostcode) {
    let ratingImg = "<img src='" + urls[rating] + "' alt='Hygiene rating of " + rating + "' />";
    let FsaLink = "<a style='float:right; margin-top: -10px;' href='" + generateFsaLinkUrl(takeawayName, takeawayPostcode) + "'>" + ratingImg + " </a>";

    document.getElementsByClassName(JUST_EAT_INDIVIDUAL_PLACEHOLDER)[0].innerHTML += FsaLink;
}

function getHHSearchPostcode(takeawayName, url, indexOfTakewayOnList) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            let _html = $(this.responseText);
            let _address = $(".address", _html);
            let _postCode = $.trim(_address[0].childNodes[5].innerText);

            for (let i = 0; i < _address[0].childNodes.length; i++) {
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
        let jsonResponse = JSON.parse(response.rating);
        let rating = 6;
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            if (jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.length > 1) {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail[0].RatingValue;
            } else {
                rating = jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue;
            }
            // Inject the rating
            setHungryHouseSearchListRating(rating, index, takeawayName, takeawayPostcode);
        } else {
            setHungryHouseSearchListRating(6, index);
        }
    });
}

/**
 * Checks if the postcode is in a valid format. Returns true if it is. False otherwise
 * @param postcode
 * @returns {boolean}
 */
function valid_postcode(postcode) {
    postcode = postcode.replace(/\s/g, "");
    let regex = /^[A-Z]{1,2}[0-9]{1,2} ?[0-9][A-Z]{2}$/i;
    return regex.test(postcode);
}

/**
 * Inserts space in postcode. The postcode given by Deliveroo does not contain any spaces. However, FSA Rating does not
 * work where a space isn't given.
 *
 * Format       Coverage	                Example
 * AA9A 9AA     WC postcode area;           EC1–EC4, NW1W, SE1P, SW1	EC1A 1BB
 * A9A 9AA      E1W, N1C, N1P	            W1A 0AX
 * A9 9AA       B, E, G, L, M, N, S, W	    M1 1AE
 * A99 9AA                                  B33 8TH
 * AA9 9AA      All other postcodes        	CR2 6XH
 * AA99 9AA                                 DN55 1PT
 *
 * @param postcode
 * @returns {string}
 */
function postcodeWithSpace(postcode) {
    let offset = 2 + (postcode.length - 5);
    return postcode.substring(0, offset) + " " + postcode.substring(offset, postcode.length);
}

/**
 * Generates the link URL for the FSA website for a given takeaway
 * @param takeawayName
 * @param takeawayPostcode
 */
function generateFsaLinkUrl(takeawayName, takeawayPostcode) {
    return FSA_LINK_URL_PREFIX + takeawayName + "/" + takeawayPostcode  + "/" + FSA_LINK_URL_POSTFIX;
}

/**
 * Inserts a HTML node after a reference node.
 * @param newNode
 * @param referenceNode
 */
function insertAfterNode(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}