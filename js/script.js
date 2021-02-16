//ADD YOUTUBE API KEY BELOW.
function getMyKey() {
    return '';
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


function nl2br (str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function YouTubeGetID(url){
    var ID = '';
    url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if(url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    }
    else {
        ID = url;
    }
    return ID;
}


$('.ov-share .copy').on('click', function(){
    $('#shareurl').select();
    document.execCommand("copy");
});

$('#vidid').on('click', function(){
    $(this).select();
});

$('#formurl').on('submit',function(e){
    e.preventDefault();
    var videourl = document.getElementById('vidid');
    if(videourl.value == $(videourl).data('title')) { //prevent submiting title
        return false;
    }
    var id = YouTubeGetID(videourl.value);
    videourl.value = id;

    this.submit();
});

$('#formchannelid').on('submit',function(e){
    e.preventDefault();
    var searchName = $(this).find('.searchchannel').val();
    ChannelID.getChannelID(searchName);
});
$('#vidid-type a').on('click', function(){
    var input =  $('#vidid');
    switch($(this).attr('class')) {
        case 'set-title':
            Video.params.showtype = 'title';
            var title = input.data('title');
            input.val(title);
            break;
        case 'set-id':
            var id;
            Video.params.showtype = 'id';
            if(input.data('channelid') != undefined) {
                id = input.data('channelid');
            } else {
                id = input.data('videoid');
            }
            input.val(id);
            break;
    }
});


var exampleItems = ['T0ivG4Ew-Lk', 'UCbKxy8dZtU1JcYFYR7RbB-g', 'UC6g5sQONOBrHvji67JSN7hQ']; //can be channelID, videoID; not URL

var startItem = null;

var Video = {};
Video.params = {
    videoid: startItem,
    showtype: 'title',
    intervalVideo: null
};
Video.data = {
    title: null,
    desc: null
}

var Channel = {};
Channel.params = {
    channelID: startItem
};


Channel.getData = function(successCallback, errorCallback) {
    var apiKey = getMyKey();
    var apiUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId='+Channel.params.channelID+'&eventType=live&type=video&maxResults=1&key='+apiKey; //ONLY BY CHANNELID
//        var apiUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q='+Channel.params.channelID+'&key='+apiKey; //BY CHANNELID/NAME
//        var apiUrl = 'http://localhost/likescounter/test.json';

    $.ajax({
        success : function(data, textStatus, xhr) {
            if(data.items.length<1) { //no items
                if(errorCallback) errorCallback(null,null,'noitems');
                return false;
            }
            if(successCallback) successCallback( data, textStatus, xhr );
        },
        error : function (xhr, textStatus, errorThrown) {
            if(xhr.status == 400) {
                errorCallback(null, null, 'nochannel');
                return false; //prevent setting interval
            }
            if(errorCallback) errorCallback(xhr, textStatus, errorThrown);
        },
        url: apiUrl,
        type : 'GET'
    });
};

var snippetIterator = 0;

Video.getData = function(successCallback, errorCallback, parts) {
    if(parts == undefined) {
        parts = 'statistics,liveStreamingDetails';
    }
    if(snippetIterator % 30 == 0) {
        parts = 'snippet,'+parts;
    }

    var apiKey = getMyKey();
    console.log(apiKey);

    var apiUrl = 'https://www.googleapis.com/youtube/v3/videos?id='+Video.params.videoid+'&part='+parts+'&key=' + apiKey;
//        var apiUrl = 'http://davidos.dz.cr/likescounter/check.php';
    $.ajax({
        success : function(data, textStatus, xhr) {
//                console.log(data);
            if(data.items.length<1) { //no items
                if(errorCallback) errorCallback(null,null,'noitems');
                return false;
            }
            snippetIterator++;
            successCallback( data, textStatus, xhr );
        },
        error : function (xhr, textStatus, errorThrown) {
            if(errorCallback) errorCallback(xhr, textStatus, errorThrown);
        },
        url: apiUrl,
        type : 'GET'
    });
};



Video.getLikes = function (data) {
    return data.items[0].statistics.likeCount;
};
Video.getDisLikes = function (data) {
    return data.items[0].statistics.dislikeCount;
};

Video.getViewCount = function (data) {
    return data.items[0].statistics.viewCount;
};

Video.getCommentCount = function (data) {
    return data.items[0].statistics.commentCount;
};

Video.getLiveStreamViewers = function (data) {
    if(data.items[0].liveStreamingDetails) {
        return data.items[0].liveStreamingDetails.concurrentViewers;
    } else {
        return false;
    }
};


Video.checkLiveStream = function (data) {
    if(data.items[0].liveStreamingDetails) {
        return true;
    } else {
        return false;
    }
};

Video.getCommentCount = function (data) {
    return data.items[0].statistics.commentCount;
};

Video.getTitle = function (data) {
    if(data.items[0].snippet) {
        Video.data.title = data.items[0].snippet.title;
        return data.items[0].snippet.title;
    } else {
        return Video.data.title;
    }
};

Video.getDescription = function (data) {
    if(data.items[0].snippet) {
        Video.data.desc = data.items[0].snippet.description;
        return data.items[0].snippet.description;
    }
};

var getting = 0;
var loopStarted = 0;
var videoIterator = 0;
Video.init = function() {
    Video.getData(function(data){
        getting = 0;

        $('.info').hide();
        if(!loopStarted) {
            $('.counter').show();
            $('.info').html('').hide();
            if(data.items[0].snippet) {
                $('#vidid').val(Video.getTitle(data));
                $('#vidid').data('title', Video.getTitle(data));

                Video.params.channelId = data.items[0].snippet.channelId;
                Video.params.channelTitle = data.items[0].snippet.channelTitle;
                $('.channel-details .channelid').text(Video.params.channelId);
                $('.channel-details .channelname').text(Video.params.channelTitle);
            }

            $('#vidid').data('videoid', Video.params.videoid);
//                $('.title').text(Video.getTitle(data));
            if(Video.getLiveStreamViewers(data)) $('.ov-livestreamviewers').addClass('live-on');



            /*
             $('.details').html(
             '<p><strong>Tagi: </strong>'+data.items[0].snippet.tags + '</p>'+
             '<p><strong>Opis: </strong>'+nl2br(data.items[0].snippet.description) + '</p>'+
             '<p><strong>KanałID: </strong>'+data.items[0].snippet.channelId + '</p>'+
             '<p><strong>Kanał: </strong>'+data.items[0].snippet.channelTitle + '</p>'
             );
             */


            new Odometer({
                el: document.querySelector('.likes'),
                value: Video.getLikes(data),

                format: '( ddd)'
            });

            new Odometer({
                el: document.querySelector('.dislikes'),
                value: Video.getDisLikes(data),

                format: '( ddd)'
            });

            if(Video.getLiveStreamViewers(data)) {
                new Odometer({
                    el: document.querySelector('.views'),
                    value: Video.getLiveStreamViewers(data),

                    format: '( ddd)'
                });

                $('.views-total').parent().show();
                new Odometer({
                    el: document.querySelector('.views-total'),
                    value: Video.getViewCount(data),

                    format: '( ddd)'
                });
            } else {
//                    $('.livestreamviewers').parent().hide();
                $('.views-total').parent().hide();
                new Odometer({
                    el: document.querySelector('.views'),
                    value: Video.getViewCount(data),

                    format: '( ddd)'
                });
            }

            if(!Video.checkLiveStream(data)) { //if not livestream
                new Odometer({
                    el: document.querySelector('.comments'),
                    value: Video.getCommentCount(data),

                    format: '( ddd)'
                });
            } else {
                $('.comments').parent().hide();
            }



            Video.params.intervalVideo = setInterval(function(){
                videoIterator++;
                console.log('[VIDEO Interval #'+videoIterator+'] '+new Date()); //just for debug
                if(!getting) {
                    Video.live();
                }
            }, 7000);

            loopStarted = 1;
        } else {
            if(Video.params.showtype == 'title') {
                $('#vidid').val(Video.getTitle(data));
            }
//                $('.title').text(Video.getTitle(data));
            document.querySelector('.likes').innerHTML = Video.getLikes(data);
            document.querySelector('.dislikes').innerHTML = Video.getDisLikes(data);
            if(Video.checkLiveStream(data)) { //if live then show views total nad live viewers, else only total video views
                document.querySelector('.views').innerHTML = Video.getLiveStreamViewers(data);
                document.querySelector('.views-total').innerHTML = Video.getViewCount(data);
            } else {
                document.querySelector('.views').innerHTML = Video.getViewCount(data);
            }

            if(!Video.checkLiveStream(data)) document.querySelector('.comments').innerHTML = Video.getCommentCount(data);
        }

        console.log(data);
        console.log('Like: '+Video.getLikes(data));
        console.log('Dislike: '+Video.getDisLikes(data));
        console.log('LiveStream Viewers: '+Video.getLiveStreamViewers(data));
        console.log('Total Views: '+Video.getViewCount(data));
        console.log('Comments: '+Video.getCommentCount(data));
        console.log('---');


        if(typeof data.items[0].liveStreamingDetails !== 'undefined' && typeof data.items[0].liveStreamingDetails.actualEndTime !== 'undefined') {
            var ended = data.items[0].liveStreamingDetails.actualEndTime;
            var date = new Date(ended);
            var curr_date = date.getDate();
            var curr_month = date.getMonth() + 1; //Months are zero based
            var curr_year = date.getFullYear();
            var curr_hour = date.getHours();
            var curr_minutes = date.getMinutes();
            $('.info').show().html(getTrans('live-ended')+': ' + curr_date + "." + curr_month + "." + curr_year + " " + curr_hour + ":" + curr_minutes);
//                clearInterval(Video.params.intervalVideo);
        }

    }, function (xhr, textStatus, errorThrown) {
        getting = 0;

        var response = xhr.responseText;
        var obj = JSON.parse(response);
        if(errorThrown == 'noitems') {
            $('.info').show().html(getTrans('error-wrong-id')+' :)');
            clearInterval(Video.params.intervalVideo);
            $('.counter').hide();
            console.log('Terminating');
        }
        else if(typeof obj.error.errors[0].domain !== undefined && obj.error.errors[0].domain == 'usageLimits') {
            console.log('#Error with YouTube API - key limits.. Retrying with other key!#');
            Video.init(); //no loop problem thanks to loopStarted variable :)
            getting = 1;
            //TODO: remove from array wrong api keys
        }
        else {
            $('.info').show().html('Error');
        }

//            clearInterval(intervalVideo); //turn off for infinite loop
        return false;
    });
};

Video.live = function() {
    Video.init();
};

var channelIntervalSet = 0;
var channelIntervalIterator = 0;
Channel.live = function() {
    Channel.getData(function (data) {
        console.log(data);
        Video.params.videoid = data.items[0].id.videoId;
        $('#vidid').data('channelid', Channel.params.channelID);
        $('.info').html('').hide();

        if(channelIntervalSet == 1) {
            clearInterval(intervalChannelID);
        }
        Video.init();
    }, function(xhr, textStatus, errorThrown){
        if(errorThrown == 'noitems') {
            channelIntervalIterator++;
            $('.info').show().html(getTrans('error-no-live')+';) #' + channelIntervalIterator);
        } else if(errorThrown == 'nochannel') {
            $('.info').show().html(getTrans('error-wrong-id-channel')+'!');

            return false;
        } else {
            $('.info').show().html('Error');
        }

        if(channelIntervalSet == 0) {
            intervalChannelID = setInterval(function(){
                console.log('Refreshing - waiting for livestream');
                Channel.live();
            }, 7000);
            channelIntervalSet = 1;
        }
    });
};


var videoID = getParameterByName('vidid');
if(videoID) {
    Video.params.videoid = videoID;
} else {
    videoID = Video.params.videoid;
}

if(videoID != null && videoID.length>12) {
    Channel.params.channelID = videoID;
    Channel.live();
} else if(videoID != null) {
    Video.init();
}

$('input[name=vidid]').val(Video.params.videoid);



var ChannelID = {
    channelInfo: null,

    getChannelID: function(name) {
        var apiKey = getMyKey();
        var apiUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=3&q='+name+'&key='+apiKey; //BY CHANNELID/NAME
        var $this = this;

        $.ajax({
            success : function(data, textStatus, xhr) {
                if(data.items.length<1) { //no items
                    return false;
                }
                console.log(data);

                $this.writeInfo('.channellist', data.items);
            },
            error : function (xhr, textStatus, errorThrown) {
                if(xhr.status == 400) {
                    return false; //prevent setting interval
                }
            },
            url: apiUrl,
            type : 'GET'
        });
    },
    writeInfo: function(idDiv, channelInfo) {
        $(idDiv).empty();

        for (var i = 0, len = channelInfo.length; i < len; i++) {
            var singleChannelInfo = this.formatDetails(channelInfo[i]);

            $(idDiv).append(
                '<li>' +
                '<img class="channelThumb" src="'+singleChannelInfo.channelThumb+'">' +
                '<div class="channelId"><strong>ChannelID: </strong><a href="?vidid='+singleChannelInfo.channelID+'" target="_blank">'+singleChannelInfo.channelID+'</a></div>' +
                '<div class="channelTitle"><strong>Nazwa YT: </strong><a href="https://youtube.com/channel/'+singleChannelInfo.channelID+'" target="_blank">'+singleChannelInfo.channelTitle+'</a></div>' +
                (singleChannelInfo.channelDesc.length>1 ? '<div class="channelDesc"><strong>Opis: </strong>'+singleChannelInfo.channelDesc.substr(0,200)+ '</div>' : '') +
                '</li>');
        }
        var ytHelptxt = getTrans('channelid-wrong');
        $(idDiv).append('<p class="youtube-help">'+ytHelptxt+'</p>');


    },
    formatDetails: function (channelInfo) {
        var channelID = channelInfo.id.channelId;
        var channelTitle = channelInfo.snippet.channelTitle;
        var channelDesc = channelInfo.snippet.description;
        var channelThumb = channelInfo.snippet.thumbnails.high.url;
        var channelObj = {channelID: channelID, channelTitle: channelTitle, channelDesc: channelDesc, channelThumb:channelThumb};

        return channelObj;
    }

}

//TODO: CHECK FOR END OF STREAM
//TODO: EMBED search by name from CHANNELID https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=nick/channelid&key=key

$(document).ready(function(){
    $('#shareurl').val(window.location.href);
    $('[data-toggle="tooltip"]').tooltip();


    if(getCookie('colorselect-tooltipclose') != 1) {
        $('.colorselect .infobox').show();
    }

    $('.colorselect .infobox .closebox').on('click', function(e){
        e.preventDefault();
        if(getCookie('colorselect-tooltipclose') != 1) {
            setCookie('colorselect-tooltipclose',1,60);
            $('.colorselect .infobox').fadeOut();
        }
    });


    $('.lang-select').on('change', function() {
        $(this).submit();
    });

});

