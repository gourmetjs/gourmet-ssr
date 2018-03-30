import React, {PureComponent} from "react";
import classNames from "classnames";
import Button from "reactstrap/lib/Button";
import Modal from "reactstrap/lib/Modal";
import ModalHeader from "reactstrap/lib/ModalHeader";
import ModalBody from "reactstrap/lib/ModalBody";
import ModalFooter from "reactstrap/lib/ModalFooter";

export default class DialogContainer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showDialog: false
    };
  }

  render() {
    const props = this.props;

    return (
      <div>
        <Button onClick={() => this._toggle()}>
          {props.buttonText}
        </Button>
        <Modal
          isOpen={this.state.showDialog}
          toggle={() => this._toggle()}
        >
          <ModalHeader toggle={() => this._toggle()}>
            {this._getIcon()}
            {props.title}
          </ModalHeader>
          <ModalBody>
            {props.children}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => this._toggle()}>
              {props.cancelButtonText}
            </Button>
            <Button onClick={() => this._toggle()} color="primary">
              {props.okButtonText}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }

  _toggle() {
    this.setState({
      showDialog: !this.state.showDialog
    });
  }

  _getIcon() {
    if (this.props.iconName) {
      return (
        <span className={classNames(this.props.iconName, "with-text")}/>
      );
    }
    return null;
  }
}

DialogContainer.defaultProps = {
  iconName: "icon ion-person",
  buttonText: "Open Dialog",
  title: "Dialog",
  okButtonText: "OK",
  cancelButtonText: "Cancel"
};
