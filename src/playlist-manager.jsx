import React from "react"
import LoginControl from "./login-control"

export default class PlaylistManager extends React.Component {
  constructor() {
    super()

    this.handleLoginSuccess = this.handleLoginSuccess.bind(this)
    this.handleLoginFailed = this.handleLoginFailed.bind(this)
    this.handleLogout = this.handleLogout.bind(this)

    this.state = {
      accessToken: null
    }
  }

  handleLoginSuccess(accessToken) {
    this.setState( { accessToken: accessToken} )
  }

  handleLoginFailed(accessToken) {
    this.setState( { accessToken: null} )
  }

  handleLogout() {
    this.setState( { accessToken: null} )
  }

  render() {
    return(
      <div>
        <h1>YouTube Playlist Manager</h1>
        <LoginControl
          isLoggedIn={!!this.state.accessToken}
          onLoginSuccess={this.handleLoginSuccess}
          onLogout={this.handleLogout} />
        <div>
          {this.state.accessToken}
        </div>
      </div>
    )
  }
}
