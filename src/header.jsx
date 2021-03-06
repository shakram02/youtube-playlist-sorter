import React from "react"
import PropTypes from "prop-types"

const Header = (props) => {
  return(
    <div className="header container">
      <div className="row header-row">
        <div className="col-xs-3 header-title">
          Playlist Sorter
        </div>
        <div
          className="col-xs-6 center-text header-status-text"
          dangerouslySetInnerHTML={{__html: props.statusMessage}}>
        </div>
        <div className="col-xs-3">
          <button className="btn btn-info pull-right header-logout" onClick={() => props.onLogout()}>Logout</button>
        </div>
      </div>
    </div>
  )
}

Header.propTypes = {
  statusMessage: PropTypes.string,
  onLogout: PropTypes.func.isRequired
}

export default Header
