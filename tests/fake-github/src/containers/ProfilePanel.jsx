import React, {PureComponent, Fragment} from "react";
import {css} from "emotion";
import Form from "reactstrap/lib/Form";
import FormGroup from "reactstrap/lib/FormGroup";
import Label from "reactstrap/lib/Label";
import Input from "reactstrap/lib/Input";
import Button from "reactstrap/lib/Button";
import Alert from "reactstrap/lib/Alert";
import DialogContainer from "../components/DialogContainer";
import FormHeader from "../components/FormHeader";
import defaultProfilePhoto from "../images/john_doe_profile.jpeg";

const cssContainer = css`
  display: flex;
`;

const cssForm = css`
  flex: auto;
  padding: 0 1.5rem;
`;

const cssPhotoContainer = css`
  width: 210px;
  flex: none;
  text-align: center;
`;

const cssPhoto = css`
  max-width: 180px;
  max-height: 180px;
`;

export default class ProfilePanel extends PureComponent {
  render() {
    const user = this.props.user;
    return (
      <Fragment>
        <FormHeader>
          Public profile
        </FormHeader>
        {user ? this._renderPanel(user) : this._renderLoading()}
      </Fragment>
    );
  }

  _renderLoading() {
    return (
      <div>
        Loading....
      </div>
    );
  }

  _renderPanel(user) {
    return (
      <Fragment>
        <div className={cssContainer}>
          <Form className={cssForm}>
            <FormGroup>
              <Label>Name</Label>
              <Input type="text" defaultValue={user.displayName}/>
            </FormGroup>
            <FormGroup>
              <Label>Public email</Label>
              <Input type="select" defaultValue="v0">
                {["Select a verified email to display"].concat(user.emails).map((email, idx) => {
                  <option value={`v${idx}`}>{email}</option>;
                })}
              </Input>
              <small className="form-text text-muted">
                You can manage verified email addresses in your <a href="#">email settings</a>.
              </small>
            </FormGroup>
            <FormGroup>
              <Label>Bio</Label>
              <Input type="textarea"/>
              <small className="form-text text-muted">
                You can <strong>@mention</strong> other users and organizations to link to them.
              </small>
            </FormGroup>
            <FormGroup>
              <Label>URL</Label>
              <Input type="text" defaultValue={user.url}/>
            </FormGroup>
            <FormGroup>
              <Label>Company</Label>
              <Input type="text" defaultValue={user.company}/>
            </FormGroup>
            <FormGroup>
              <Label>Location</Label>
              <Input type="text" defaultValue={user.location}/>
            </FormGroup>
          </Form>
          <div className={cssPhotoContainer}>
            <FormGroup>
              <img src={user.photoUrl || defaultProfilePhoto} className={cssPhoto}/>
            </FormGroup>
            <FormGroup>
              <DialogContainer
                buttonText="Upload new picture"
                title="Upload profile picture"
                okButtonText="Upload"
              >
                <div>
                  Upload your profile picture. It should be a square image bigger than 180x180.
                </div>
                <img
                  style={ {
                    margin: "1em",
                    maxWidth: "300px",
                    maxHeight: "300px"
                  } }
                  src={user.photoUrl || defaultProfilePhoto}
                />
              </DialogContainer>
            </FormGroup>
          </div>
        </div>
        <FormHeader>
          Contributions
        </FormHeader>
        <FormGroup className="form-check">
          <Label check>
            <Input type="checkbox"/>
            Include private contributions on my profile
          </Label>
          <small className="form-text text-muted">
            Get credit for all your work by showing the number of contributions to private
            repositories on your profile without any repository or organization information.
            <a href="#">Learn how we count contributions</a>.
          </small>
        </FormGroup>
        <FormGroup>
          <Button>
            Update contributions
          </Button>
        </FormGroup>
        <FormHeader>
          GitHub Developer Program
        </FormHeader>
        <FormGroup>
          <Alert color="info" className="with-icon">
            <i className="icon ion-information-circled"/>
            Building an application, service, or tool that integrates with GitHub?
            <a href="https://github.com/developer/register">Join the GitHub Developer Program</a>,
            or read more about it at our <a href="https://developer.github.com">Developer site</a>.
          </Alert>
          <small className="form-text text-muted">
            <a href="https://developer.github.com">Check out the Developer site</a> for guides,
            our API reference, and other resources for building applications that integrate with GitHub.
            Make sure your contact information is up-to-date below. Thanks for being a member!
          </small>
        </FormGroup>
      </Fragment>
    );
  }
}
