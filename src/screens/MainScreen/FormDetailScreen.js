import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DownloadOutlined, DeleteFilled } from '@ant-design/icons'
import { Row, Col, Button, Typography, Skeleton, message } from 'antd'
import DeleteFormModal from '../../components/form/DeleteFormModal'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'

const { Title } = Typography

export default function FormDetailScreen (props) {
  const { id } = useParams()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [form, setForm] = useState(null)
  // const [isLoading, setLoading] = useState(false)

  const deleteToggle = () => setDeleteConfirm(!deleteConfirm)

  useEffect(() => {
    const db = firebase.firestore()
    const ref = db.collection('forms').doc(id)
    const unsub = ref.onSnapshot(s => {
      if (!s.exists) setForm(() => (false))
      setForm(() => (s.data()))
    })

    return () => { unsub && unsub() }
  }, [])

  const prevent = (item, data) => {
    if (!data) {
      message.error('Error ' + item + ' Not Found!')
      return false
    } else return true
  }

  const downloadPDF = () => {
    if (!prevent('Form', form)) return
    const element = document.createElement('a')
    element.setAttribute('href', form.url.form)
    element.setAttribute('target', '_blank')

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }

  if (!form && form !== null) {
    return (
      <Title level={1}>404 Not Found!</Title>
    )
  }

  return (
    <>
      <DeleteFormModal form={form} id={id} visible={deleteConfirm} toggleModal={deleteToggle} />
      <Title level={1}>
        {
          form === null ? <Skeleton paragraph={false} active /> : form.name
        }
      </Title>
      <Row justify="space-between">
        <Col xs={2}>
          <Button onClick={downloadPDF} icon={<DownloadOutlined />}>
            Download Original PDF File
          </Button>
        </Col>
        <Col xs={2}>
          <Button onClick={deleteToggle} icon={<DeleteFilled />} shape="circle" type="primary" danger />
        </Col>
      </Row>
    </>
  )
}
