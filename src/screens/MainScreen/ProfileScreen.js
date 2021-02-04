import React, { useEffect, useState } from 'react'
import 'cropperjs/dist/cropper.css'
import '../../assets/styles/croppercircular.css'
import Cropper from 'cropperjs'
import { Upload, Image, Modal, Avatar, Input, Button, message, Progress, Spin } from 'antd'
import { LoadingOutlined, UserOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons'
import firebase from 'firebase/app'
import 'firebase/storage'
import 'firebase/auth'

export default function ProfileScreen () {
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [email, setEmail] = useState('')
  const [uid, setUid] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [imgSrc, setImgSrc] = useState('')
  const [cropper, setCropper] = useState(null)
  const [modal, setModal] = useState(false)
  const [avartar, setAvatar] = useState(null)
  const [progress, setProgress] = useState(null)
  const loadingIcon = <LoadingOutlined style={{ marginRight: '5px', color: '#1890ff' }} spin />

  const styles = {
    inputStyle: {
      marginTop: 10
    }
  }

  const selectFile = ({ file, onProgress, onSuccess, onError }) => {
    // setImgSrc(file)
    setImgSrc(URL.createObjectURL(file))
    setModal(true)
    const image = document.querySelector('#image-cropper')
    console.log(image.firstChild)
    if (cropper) {
      cropper.replace(URL.createObjectURL(file))
      cropper.reset()
    } else {
      const croppertmp = new Cropper(image.firstChild, {
        aspectRatio: 1 / 1
      })
      setCropper(croppertmp)
    }
  }

  const upload = async file => {
    const storage = firebase.storage()
    const user = firebase.auth().currentUser
    const storageRef = storage
      .ref()
      .child(`profile/${user.uid}/profile.png`)
    setProgress(0)
    const task = storageRef.putString(file, 'data_url')
    task.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      setProgress(Math.round(progress))
    }, err => {
      console.log(err)
      message.error('something error while uploading')
    }, async () => {
      const db = firebase.firestore()
      const ref = db.collection('users').doc(user.uid)
      await ref.set({
        picture_profile: `profile/${user.uid}/profile.png`,
        updated_time: new Date()
      }, { merge: true })
      const url = await storageRef.getDownloadURL()
      setAvatar(url)
      setProgress(null)
      message.success('upload profile successful')
    })
  }

  const props = {
    name: 'file',
    // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    customRequest: selectFile,
    headers: {
      authorization: 'authorization-text'
    },
    showUploadList: false
  }

  useEffect(() => {
    setLoading(true)
    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        setEmail(user.email)
        setUid(user.uid)
        const db = firebase.firestore()
        const ref = db.collection('users').doc(user.uid)
        const doc = await ref.get()
        if (doc.exists) {
          setFname(doc.data().fname ? doc.data().fname : '')
          setLname(doc.data().lname ? doc.data().lname : '')
          if (doc.data().picture_profile) {
            const storage = firebase.storage()
            try {
              const url = await storage.ref().child(doc.data().picture_profile).getDownloadURL()
              setAvatar(url)
            } catch (error) {
              console.log(error)
              message.error('something is wrong with avatar')
            }
          }
        }
      }
      setLoading(false)
    })
  }, [])

  const save = async () => {
    const db = firebase.firestore()
    try {
      await db
        .collection('users')
        .doc(uid)
        .set({
          fname,
          lname,
          updated_time: new Date()
        }, { merge: true })
      message.success('บันทึกสำเร็จ')
    } catch (error) {
      message.error('บันทึกล้มเหลว โปรดลองอีกครั้ง')
      console.log(error)
    }
  }
  const logout = () => {
    const auth = firebase.auth()
    auth.signOut()
  }

  if (isLoading) return <Spin indicator={loadingIcon} />

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center'
      }}>
      <div
        style={{
          width: '95%',
          padding: '10px',
          background: 'white',
          height: '80%',
          borderRadius: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
        <Avatar
          size={100}
          style={{ marginBottom: '5px' }}
          icon={<UserOutlined />}
          src={
            avartar || null
          }
        />
        {progress === null
          ? null
          : <Progress percent={progress} />
        }
        <Modal
          title="Crop Image"
          visible={modal}
          onOk={() => {
            setModal(false)
            upload(cropper.getCroppedCanvas().toDataURL())
          }}
          onCancel={() => setModal(false)}>
          <Image
            className="circle"
            id="image-cropper"
            preview={false}
            src={imgSrc}
            alt="profile"
          />
          <Button onClick={() => {
            // setImgSrc2(cropper.getCroppedCanvas().toDataURL())
            cropper.reset()
          }}>
            reset
          </Button>
        </Modal>
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>Change Profile</Button>
        </Upload>
        <Input
          onChange={e => setFname(e.target.value)}
          value={fname}
          addonBefore={'First Name'}
          style={styles.inputStyle}
          size="large"
          placeholder="First Name"
        />
        <Input
          addonBefore={'Last Name'}
          onChange={e => setLname(e.target.value)}
          value={lname}
          style={styles.inputStyle}
          size="large"
          placeholder="Last Name"
        />
        <Input
          disabled
          value={email}
          addonBefore={'E-Mail'}
          style={styles.inputStyle}
          size="large"
          placeholder="E-mail"
        />
        <Button
          onClick={save}
          style={styles.inputStyle}
          shape="round"
          type="primary"
          icon={<SaveOutlined />}
          size={60}>
          Save
        </Button>
        <Button
          onClick={logout}
          style={styles.inputStyle}
          shape="round"
          size={60}>
          Log Out
        </Button>
      </div>
    </div>
  )
}
