import React from "react"
import CircularProgressbar from 'react-circular-progressbar';

export default class PlaylistDetailsPanel extends React.Component {
  constructor(props) {
    super(props)

    this.handleSortClicked = this.handleSortClicked.bind(this)

    this.state = {
      playlistItems: [],
      percentComplete: 100
    }
  }

  componentDidMount() {
    this.props.onProgressStart("Loading videos...")
    this.loadPlaylistItems()
  }

  render() {
    let items = this.state.playlistItems.map((playlistItem) =>
      <li key={playlistItem.id}>
        <div className="item video-item">
          <a href={`https://www.youtube.com/watch?v=${playlistItem.snippet.resourceId.videoId}`} target="_blank">
            <img src={playlistItem.snippet.thumbnails.default.url} />
            <div className="info">
              <div className="title">{playlistItem.snippet.title}</div>
            </div>
          </a>
        </div>
      </li>
    )

    let itemCount = this.props.itemCount
    let videoCountText = `(${itemCount} ${itemCount == 1 ? "video" : "videos"})`
    let playlistUrl = `https://www.youtube.com/playlist?list=${this.props.playlist.id}`
    let progressCircle = null
    if (this.state.percentComplete != 100) {
      progressCircle = <CircularProgressbar percentage={this.state.percentComplete} textForPercentage={(pct) => ""} />
    }

    return(
      <div className="content-panel container">
        <div className="row">
          <div className="col-xs-4 back-link">
            <a href="#" onClick={() => this.props.onBackToPlaylists()}>&larr; Back to Playlists</a>
          </div>
          <div className="col-xs-4 playlist-title center-text">
            {this.props.playlist.snippet.title} {videoCountText}
          </div>
          <div className="col-xs-4 youtube-nav-link">
            <a className="pull-right" href={playlistUrl} target="_blank">Go to this playlist on YouTube</a>
          </div>
        </div>
        <div className="action-row">
          <span>Sort: </span>
          <a href="#" className="sort-link" onClick={() => this.handleSortClicked(false)}>A-Z</a>
          <a href="#" className="sort-link" onClick={() => this.handleSortClicked(true)}>Z-A</a>
          <div className="sort-progress-bar">
            {progressCircle}
          </div>
        </div>
        <div className="playlist-items">
          <ul className="item-list">{items}</ul>
        </div>
      </div>
    )
  }

  handleSortClicked(isDescending) {
    this.props.onProgressStart("Sorting videos...")

    let itemsCopy = Array.from(this.state.playlistItems)
    itemsCopy = this.sortPlaylistItems(itemsCopy, isDescending)

    for (let [index, playlistItem] of itemsCopy.entries()) {
      playlistItem.snippet.position = index
    }

    this.updatePlaylistItems(Array.from(itemsCopy)).then(() => {
      this.setState({
        playlistItems: itemsCopy
      })
    })
    .catch((error) => {
      this.props.onError(error.message)
    })
    .then(() => {
      this.props.onProgressStop()
      this.setState({
        percentComplete: 100
      })
    })
  }

  loadPlaylistItems() {
    let playlistItems = []

    this.getPlaylistItems(null, this.props.playlist.id, playlistItems, (error) => {
      if (error) {
        this.props.onError(`Error retrieving playlist details: ${error}`)
      } else {
        this.setState({
          playlistItems: playlistItems
        })

        this.props.onProgressStop()
      }
    })
  }

  getPlaylistItems(pageToken, playlistId, playlistItems, callback) {
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`

    if (pageToken) {
      url += "&pageToken=" + pageToken
    }

    let options = {
      headers: {
        "Authorization": "Bearer " + this.props.accessToken
      }
    }

    fetch(url, options)
      .then((response) => {
        if (response.status != 200) {
          callback(response.status)
          return
        }

        response.json().then((data) => {
          for(let playlistItem of data.items) {
            playlistItems.push(playlistItem)
          }

          if (data.nextPageToken) {
            this.getPlaylistItems(data.nextPageToken, playlistId, playlistItems, callback)
          } else {
            callback()
          }
        })
      })
      .catch(function(error) {
        callback(error)
      })
  }

  sortPlaylistItems(playlistItems, isDescending) {
    playlistItems.sort((a, b) => {
      if (isDescending) {
        if (b.snippet.title < a.snippet.title) {
          return -1
        }
        if (b.snippet.title > a.snippet.title) {
          return 1
        }
        return 0
      } else {
        if (a.snippet.title < b.snippet.title) {
          return -1
        }
        if (a.snippet.title > b.snippet.title) {
          return 1
        }
        return 0
      }
    })

    return playlistItems
  }

  updatePlaylistItems(itemsRemaining) {
    this.updatePercentComplete(itemsRemaining)
    let toUpdate = itemsRemaining.shift()
    return this.updatePlaylistItem(toUpdate).then(() => {
      if (itemsRemaining.length > 0) {
        return this.updatePlaylistItems(itemsRemaining)
      }
    })
  }

  updatePercentComplete(itemsRemaining) {
    let complete = this.state.playlistItems.length - itemsRemaining.length
    console.log(complete)
    let percentComplete = Math.floor(complete / this.state.playlistItems.length * 100)
    console.log(percentComplete)
    this.setState({
      percentComplete: percentComplete
    })
  }

  updatePlaylistItem(playlistItem) {
    let url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet"

    let options = {
      method: 'put',
      headers: {
        "Authorization": "Bearer " + this.props.accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(playlistItem)
    }

    let progress = `Sorting video ${playlistItem.snippet.title}`
    this.props.onProgressStart(progress.substr(0, 50) + "...")

    return fetch(url, options).then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          let message = this.getErrorMessage(data) || `updating playlistItem: ${response.status}`
          throw new Error(message)
        })
      }
    })
  }

  getErrorMessage(data) {
    let error = data.error

    if (error) {
      if (error.errors && error.errors.length > 0) {
        if (error.errors[0].reason == "manualSortRequired") {
          let url = `https://www.youtube.com/playlist?list=${this.props.playlist.id}`
          let playlistLink = `<a href="${url}" target="_blank">here</a>`
          return `You must first change the playlist settings to manual ordering ${playlistLink}.`
        }
      }

      return `${error.code}: ${error.message}`
    }

    return null;
  }
}
