//https://developers.google.com/youtube/iframe_api_reference
  /* this code failed on chrome app dueto security restrictions,
     so for now I just show  a url in a separate browser window
     when the select value changes.

    function init_video(){
    // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    var video_player;

    function onYouTubeIframeAPIReady() {
        video_player = new YT.Player('video_player_id', {
            height: '390',
            width:  '640',
            events: {
                'onReady': onPlayerReady
            }
        });
    }

    function onPlayerReady(event) {
        event.target.setVolume(100);
        event.target.playVideo();
    }
    */
    function video_changed(){
        var select_val = videos_id.value
        console.log(select_val)
        if ((select_val == "All")   ||
            (select_val == "None")  ||
            (select_val.startsWith("Job: "))   ||
            (select_val.startsWith("Robot: "))) {
            video_player_id.style.display         = "none";
            sim_graphics_pane_id.style.display = "inline";
        }
        else {
            //play_youtube_video(select_val)
            show_page(select_val)
        }
    }
    //function show_url(url){
    //    /*sim_graphics_pane_id.style.display = "none";
    //   video_player_id.style.display         = "inline";
    //    video_player.loadVideoById(youtube_id)
    //    */
    //    window.open(url) //"https://youtu.be/6o0gkU9SgdQ"
    //} */