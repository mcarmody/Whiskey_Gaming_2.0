// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require_tree .


$(document).ready(function() {

// set these ahead of time

    // this is milliseconds, don't forget
    var updateInterval = 60000;

    // integer relative to GMT
    var timeZone = -5;

    // references for preset IPD options, don't mess with these
    var dummyMatchData = 3562678511;
    var dummyPlayerData = 22319665;

    // html references because jQuery hates dynamic content
    var newDeviceModalHTML = $('.newDeviceModal');
    var detailTableHTML = $('#deviceTable');
    var alertsModal = $('.alertsModal');
    var editMenu = $('.editMenu');

    // self-explanatory, hopefully
    var serverIp = "https://api.opendota.com/api/";
    var warningThreshold = 10; // minutes
    var DevicesList = [
        40322344,
        108839928,
        22319665,
        72843300,
        35019058
    ]
    var mostPlayedHero;
    var fantasyScore = 0;

// don't touch these unless you know what you're doing

    // placeholders for inter-function reference
    var currentID;
    var currentFantasyScore;
    var currentBattery;
    var lastUpdateTime;
    var deviceToBeRemoved;
    var newIpd;



// -------------------------
//BEGIN FUNCTION DEFINITIONS
// -------------------------


// ----- Below functions are called on pageload -----

    //testing OpenDota API
    function opendotaTest() {
        $.ajax(
            {
                type: "GET",
                url: serverIp + 'players/' + dummyPlayerData + '/heroes',
                dataType: "json",
                success: function (response) {
                    mostPlayedHero = response[0].hero_id;
                },
                error: function() {
                    console.log("Something is wrong with the server! Can't get any device data.")
                }
            })
        $.ajax(
            {
                type: "GET",
                url: serverIp + 'heroes/',
                dataType: "json",
                success: function (response) {
                    console.log(response[mostPlayedHero-2].name);
                },
                error: function() {
                    console.log("Something is wrong with the server! Can't get any device data.")
                }
            })
        console.log(serverIp);
    };



// ----- Below are functions handling update calls and associated errors -----

    // calls to the server to update row data according to whatever is stored there
    function updateRow(thisRow) {
        var thisDeviceRow = thisRow;
        var uniqueDeviceId = $(thisDeviceRow).attr('uniqueId');
        var isValidDevice = false;
        var hernoName;
        var kda;
        currentFantasyScore = 0,
        $.ajax(
            {
                type: "GET",
                url: serverIp + 'players/' + uniqueDeviceId,
                dataType: "json",
                success: function (response) {
                    thisRow.siblings(".deviceIPD").html(response.solo_competitive_rank);
                    isValidDevice = true;

                    $.ajax(
                        {
                            type: "GET",
                            url: serverIp + '/players/' + uniqueDeviceId,
                            dataType: "json",
                            success: function (response) {
                                var hmdIndex = response.profile.personaname;
                                var updateTime = new Date().toTimeString().split(" ", 1);

                                //now we update all of the html with the various new values
                                
                                thisRow.siblings(".deviceID").html(hmdIndex);
                            },
                            error: function () {
                                thisRow.siblings(".batteryLevel").html('N/A');
                                thisRow.siblings(".lastUpdate").html('N/A');
                                thisRow.siblings(".deviceID").html(uniqueDeviceId);
                            }
                        });


                    $.ajax(
                        {
                            type: "GET",
                            url: serverIp + '/players/' + uniqueDeviceId + '/recentMatches',
                            dataType: "json",
                            success: function (response) {
                                var kills = response[0].kills;
                                var deaths = response[0].deaths;
                                var assists = response[0].assists;
                                kda = kills + '/' + deaths + '/' + assists;
                                var latestMatch = response[0].match_id;
                                var latestHeroID = response[0].hero_id;
                                var latestHero;
                                var winLoss = 'L';
                                var isRadiant = false;
                                var playerSlot = response[0].player_slot - 122;
                                var winLossStyle = 'loser';

                                $.each(response, function(index, value) {
                                    fantasyMath(response[index]);
                                });

                                if (playerSlot < 5) {
                                    isRadiant = true;
                                } else {
                                    isRadiant = false;
                                }

                                if (isRadiant && response[0].radiant_win || !isRadiant && !response[0].radiant_win) {
                                    winLoss = 'W';
                                    winLossStyle = 'winner';
                                } else {
                                    winLoss = 'L';
                                    winLossStyle = 'loser';
                                }

                                $.ajax(
                                    {
                                        type: "GET",
                                        url: serverIp + 'players/' + uniqueDeviceId + '/heroes',
                                        dataType: "json",
                                        success: function (response) {
                                            mostPlayedHero = response[0].hero_id;

                                            $.ajax(
                                                {
                                                    type: "GET",
                                                    url: serverIp + 'heroes/',
                                                    dataType: "json",
                                                    success: function (response) {
                                                        heroName = response[mostPlayedHero-2].name.toString().split("npc_dota_hero_")[1];
                                                        latestHero = response[latestHeroID-2].name.toString().split("npc_dota_hero_")[1];
                                                        thisRow.siblings(".mostPlayed").html(heroName);
                                                        thisRow.siblings(".lastUpdate").html(latestHero + ': <a href="https://www.opendota.com/matches/' + latestMatch + '">' + kda +'</a>' + ' <div class="winOrLoss" id="' + winLossStyle + '">(' + winLoss + ')</div>');
                                                    },
                                                    error: function() {
                                                        console.log("Something is wrong with the server! Can't get any device data.")
                                                    }
                                                })
                                        },
                                        error: function() {
                                            console.log("Something is wrong with the server! Can't get any device data.")
                                        }
                                    })

                                fantasyScore = fantasyScore / 20;
                                fantasyScore = Math.round(fantasyScore*100)/100;
                                thisRow.siblings(".batteryLevel").html(fantasyScore);
                                
                            },
                            error: function () {

                            }
                        });

                },
                // This will throw if the device can't be connected to
                // TO-DO: Between this functionality and the API errors, make the status of the
                // device (off, charging, etc) more human-understandable
                error: function () {
                    console.log('No device with this Unique ID (' + uniqueDeviceId +') is available.');
                    thisRow.siblings(".deviceIPD").html('N/A');
                    thisRow.siblings(".batteryLevel").html('N/A');
                    thisRow.siblings(".lastUpdate").html('Powered Down');
                    thisRow.siblings(".lastUpdate").css('color', 'lightgrey');
                    thisRow.siblings(".deviceID").html(uniqueDeviceId);
                }
            }
        );
    };

    function fantasyMath(mostRecentGame) {
        var thisGameStats = mostRecentGame;
        currentFantasyScore = thisGameStats.kills*.3 + thisGameStats.deaths*(-.3) + thisGameStats.assists*.15 + thisGameStats.last_hits*.003 + thisGameStats.gold_per_min*.002;
        currentFantasyScore = Math.round(currentFantasyScore*100)/100;                      
        fantasyScore = fantasyScore + currentFantasyScore;
    }


    // this actually renders out a new row on the table and logs a confirmation
    function addNewDeviceRow(newDeviceId) {
        $(detailTableHTML).append(deviceRowTemplateA + newDeviceId + deviceRowTemplateB);
        console.log("Device added");
    };


});

// --------------------
// BEGIN HTML TEMPLATES
// --------------------

// HTML templates for adding new rows dynamically
    var deviceRowTemplateA = 
    '<div class="deviceRow">' +
        '<div class="deviceID"></div>&nbsp'+
        '<div class="lastUpdate"></div><a id="warningAlert"></a>&nbsp'+
        '<div class="batteryLevel"></div>&nbsp'+
        '<div class="deviceIPD"></div>&nbsp'+
        '<div class="mostPlayed"></div>&nbsp'+
        '<div class="primaryButton refreshButton" uniqueId="'

    var deviceRowTemplateB = 
        '">Refresh</div>&nbsp'+
        '</div>'

