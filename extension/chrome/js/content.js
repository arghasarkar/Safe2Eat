init();

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
        var rating = getTakeawayRatingMP(takeaways[res]);
        console.log(takeaways[res]);
    }
}


function getTakeawayRatingMP(takeaway) {
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
        console.log(response.rating);
        ratingJson = response.rating;
    });
}