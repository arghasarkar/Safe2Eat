init();

urls = [chrome.extension.getURL("images/fhrs_0_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_1_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_2_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_3_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_4_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_5_en-gb.jpg"),
    chrome.extension.getURL("images/fhrs_awaitinginspection_en-gb.jpg")];

function init() {

    takeaways = []
    $( "div" ).filter(function( index ) {
        return $( this ).attr( "class" ) == "o-tile c-restaurant";
    }).each(function( index ) {

        var postcode =  $( this ).find(
            "[data-ft='restaurantDetailsAddress']"
        ).html();

        postcode = postcode.split(", ");
        postcode = postcode[postcode.length - 1];

        var rating = 0;

        takeaways.push(
            [
                postcode,

                $( this ).find(
                    "[data-ft='restaurantDetailsName']"
                ).html()

                ,
                rating
            ]
        );

    });

    for (var res in takeaways) {
        var rating = getTakeawayRatingMP(takeaways[res], res);
        console.log(takeaways[res]);
    }
}


function getTakeawayRatingMP(takeaway, index) {
    var takeawayPostcode = takeaway[0];
    var takeawayName = takeaway[1];
    /*
     var ratingUrl = FSA_HOST + takeawayName + "/" + takeawayPostcode + "/" + FSA_HOST_SUFFIX;*/
    var ratingJson = "";

    //console.log(ratingUrl);

    /*var ratingJson = $.ajax({
     url: ratingUrl,
     success: function(data) {
     console.log(data);
     },
     error: function () {
     console.log("Error!");
     }
     });chrom*/

    chrome.runtime.sendMessage({"postcode": takeawayPostcode, "name": takeawayName}, function(response) {
        jsonResponse = JSON.parse(response.rating);
        /**
         * Call a function here to insert the RATING IMAGE.
         * Index: index
         * Data: jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail
         * eg --> somefunction(index, jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.ratingValue)
         */
        if (jsonResponse.FHRSEstablishment.EstablishmentCollection) {
            insertRatingImage(index, '<img src="' + urls[jsonResponse.FHRSEstablishment.EstablishmentCollection.EstablishmentDetail.RatingValue] + '" />');
        } else {
            insertRatingImage(index, '<img src="' + urls[6] + '" />');}
    });
}



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

function insertRatingImage(index, rating) {
    //Quite possibly the most disgusting javascript selector I've ever written.
    var $detailsDiv = $("div").filter(function( index ) {
        return $( this ).attr( "class" ) == "o-tile c-restaurant";
    }).eq(index).eq(0).children().eq(0).children().eq(2).children().eq(1);
    $( "<p style='margin-top: 10px;float: right;margin-top: -30px;margin-right: 20px;'>" + rating + "</p>" ).insertAfter($detailsDiv)
}

insertRatingImage(1, "");

