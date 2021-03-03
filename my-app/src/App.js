import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import './custom.css';
import Spotify from 'spotify-web-api-js';

const spotifyWebApi = new Spotify();

class App extends Component {
  constructor(){
    super();
    const params = this.getHashParams();
    this.state ={
      loggedIn: params.access_token ? true : false,
      nowPlaying: {
        name: 'undefined',
        artist: 'undefined',
        image: '',
        link: ''
      },
      topTracks: [],
      recentlyPlayed: []
    }

    this.controls = {
      offset: 0,
      time_range: 'short_term',
      table: [],
      lookingAt: null
    }

    if (params.access_token){
      spotifyWebApi.setAccessToken(params.access_token);
      this.getNowPlaying();
      this.refreshPlaying();
    }
    else {
      alert("Please login!");
    }
  }

  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  refreshPlaying(){
    this.interval = setInterval(() => {
      this.getNowPlaying()
    }, 1000);
  }

  getNowPlaying() {
    spotifyWebApi.getMyCurrentPlaybackState()
      .then((response) => {
        console.log(response);
        if (response){
          this.setState({
            nowPlaying: {
              name: response.item.name,
              artist: response.item.artists[0].name,
              album: response.item.album.name,
              date: response.item.album.release_date,
              image: response.item.album.images[0].url,
              link: response.item.external_urls.spotify,
              progress: response.progress_ms,
              length: response.item.duration_ms
            }
          })
        }
      });
  }

  getTopTracks(){
    let limit = 50;
    this.controls.time_range = document.getElementById("time_length").value;
    this.controls.offset = document.getElementById("offset").value;

    spotifyWebApi.getMyTopTracks({limit: limit, offset: this.controls.offset, time_range: this.controls.time_range})
      .then((response) => {
        console.log("Top Tracks: ")
        console.log(response);

        this.state.topTracks = response.items;

          this.controls.table = this.state.topTracks.map((track, index) => {
            let id = index, 
            name = track.name, 
            artist = track.artists[0].name,
            album = track.album.name, 
            coverImg = track.album.images[1].url,
            link = track.external_urls.spotify;
  
            return (
                <tr key={id}>
                  <td>{id+1+parseInt(this.controls.offset)}</td>
                  <td><img src={coverImg} height='80px'/></td>
                  <td>
                    <a href={link} target="_blank">{name}</a>
                  </td>
                  <td>{artist}</td>
                  <td>{album}</td>
                  <td id={"r"+id}>{}</td>
                </tr>
            )
          });

          this.getStats(this.state.topTracks);

          console.log(this.state.topTracks);

          this.controls.lookingAt = this.state.topTracks;

          ReactDOM.render('Top Tracks', 
            document.getElementById('tableTitle'));
          ReactDOM.render((<tr><th>#</th><th>Cover</th><th>Song Name</th><th>Artist</th><th>Album</th><th>Stats</th></tr>),
            document.getElementById('tableHead'));
          ReactDOM.render(this.controls.table, 
            document.getElementById('tableBody'));

      });
  }

  getRecentlyPlayed(){
    let limit = 50;

    spotifyWebApi.getMyRecentlyPlayedTracks({limit: limit})
      .then((response) => {
        console.log("Recently Played: ");
        console.log(response);
        
        this.state.recentlyPlayed = response.items;

        let table = this.state.recentlyPlayed.map((t, index) => {
          let id = index,
          name = t.track.name,
          artist = t.track.artists[0].name,
          album = t.track.album.name, 
          date = new Date(t.played_at).toString(), 
          coverImg = t.track.album.images[1].url,
          link = t.track.external_urls.spotify;
          let context = 'https://open.spotify.com/';
          if (t.context){
            context = t.context.external_urls.spotify;
          }

          return (
            <tr key={id}>
                <td>{id+1}</td>
                <td><img src={coverImg} height='80px'/></td>
                <td>
                  <a href={link} target="_blank">{name}</a>
                </td>
                <td>{artist}</td>
                <td>{album}</td>
                <td>
                  <a href={context} target="_blank">{date}</a>
                </td>
                <td id={"r"+id}>{}</td>
            </tr>
          )  
        });

        this.getStats(this.state.recentlyPlayed);

        console.log(this.state.recentlyPlayed);

        this.controls.lookingAt = this.state.recentlyPlayed;

        ReactDOM.render('Recently Played', 
          document.getElementById('tableTitle'));
        ReactDOM.render((<tr><th>#</th><th>Cover</th><th>Song Name</th><th>Artist</th><th>Album</th><th>Time Played</th><th>Stats</th></tr>),
          document.getElementById('tableHead'));
        ReactDOM.render(table, 
          document.getElementById('tableBody'));
      });
  }

  getStats(list){
    let ids = list.map((t, index) => {
      if (t.id){return t.id}
      else {return t.track.id}
    })
    console.log(ids);
    spotifyWebApi.getAudioFeaturesForTracks(ids.join())
      .then((response) => {
        console.log(response.audio_features)
        for(let i=0;i<response.audio_features.length;i++){
          list[i].stats = response.audio_features[i];

          let stats = (<p>Energy: {list[i].stats.energy} <br /> Instrumentalness: {list[i].stats.instrumentalness}
            <br /> Tempo: {list[i].stats.tempo} <br /> Danceability: {list[i].stats.danceability}</p>);
    
          ReactDOM.render(stats,
            document.getElementById('r'+i));
        }
      });
  }

  getAverages(list){
    if (list != null){
      let averages = {
        danceability: 0,
        energy: 0,
        key: 0,
        loudness: 0,
        speechiness: 0,
        acousticness: 0,
        instrumentalness: 0,
        liveness: 0,
        valence: 0,
        tempo: 0
      }

      for (let i=0; i<list.length;i++){
        averages.danceability += list[i].stats.danceability;
        averages.energy += list[i].stats.energy;
        averages.key += list[i].stats.key;
        averages.loudness += list[i].stats.loudness;
        averages.speechiness += list[i].stats.speechiness;
        averages.acousticness += list[i].stats.acousticness;
        averages.instrumentalness += list[i].stats.instrumentalness;
        averages.liveness += list[i].stats.liveness;
        averages.valence += list[i].stats.valence;
        averages.tempo += list[i].stats.tempo;
      }

      averages.danceability /= list.length;
      averages.energy /= list.length;
      averages.key /= list.length;
      averages.loudness /= list.length;
      averages.speechiness /= list.length;
      averages.acousticness /= list.length;
      averages.instrumentalness /= list.length;
      averages.liveness /= list.length;
      averages.valence /= list.length;
      averages.tempo /= list.length;

      let stats = (<div>
        <h2>Averages</h2><p>
        Danceability: {averages.danceability.toFixed(3)} <br />
        Energy: {averages.energy.toFixed(3)} <br /> 
        Key: {averages.key.toFixed(3)} <br />
        Loudness: {averages.loudness.toFixed(3)} <br />
        Speechiness: {averages.speechiness.toFixed(3)} <br />
        Acousticness: {averages.acousticness.toFixed(3)} <br />
        Instrumentalness: {averages.instrumentalness.toFixed(3)} <br /> 
        Liveness: {averages.liveness.toFixed(3)} <br />
        Valence: {averages.valence.toFixed(3)} <br />
        Tempo: {averages.tempo.toFixed(3)} <br /> 
      </p></div>);

      ReactDOM.render(stats,
        document.getElementById('averages'));
    }
  }

  render() {
    return (
      <div className="App">
        <a href="http://localhost:8888">
          <button>Login with Spotify</button>
        </a>
        <a href={this.state.nowPlaying.link} target="_blank">
          <div>Now Playing: {this.state.nowPlaying.name} - {this.state.nowPlaying.artist}</div>
        </a>
        <div>from the album {this.state.nowPlaying.album} released {this.state.nowPlaying.date}</div>
        <div>{(this.state.nowPlaying.progress / 1000).toFixed(2)} / {(this.state.nowPlaying.length / 1000).toFixed(2)}</div>
        <div>
          <img src={this.state.nowPlaying.image} style={{width: 300}}></img>
        </div>
        <select id="time_length">
          <option value="short_term">Short Term (4 weeks)</option>
          <option value="medium_term">Medium Term (6 months)</option>
          <option value="long_term">Long Term (all time)</option>
        </select>
        <button onClick={() => this.getTopTracks()}> Show Top Tracks </button>
        <select id="offset">
          <option value={0}>1 - 50</option>
          <option value={49}>50 - 99</option>
          {/* <option value={80}>81 - 120</option>
          <option value={120}>121 - 160</option>
          <option value={160}>161 - 200</option> */}
        </select>
        <br />
        <button onClick={() => this.getNowPlaying()}> Update </button>
        <button onClick={() => this.getRecentlyPlayed()}> Show Recently Played </button>
        <button onClick={() => this.getAverages(this.controls.lookingAt)}> Get Averages </button>
        <h1 id="tableTitle"></h1>
        <table>
          <thead id="tableHead">
          </thead>
          <tbody id="tableBody">
          </tbody>
        </table>
        <div id="averages"></div>
      </div>
    );
  }
}

export default App;
