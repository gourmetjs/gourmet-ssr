import React from "react";

export default class MessageBox extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isMounted: false,
      type: props.type || "primary"
    };
  }

  componentDidMount() {
    this.setState({
      isMounted: true
    });
  }

  render() {
    const {isMounted, type} = this.state;
    return (
      <div className={`alert alert-${type}`}>
        {isMounted ? "[M] " + this.props.message : this.props.message}
        {isMounted ? (
          <span className="text-muted font-weight-light">
            -- &apos;[M]&apos; should be added when this component is mounted in DOM
          </span>
        ) : null}
      </div>
    );
  }
}
