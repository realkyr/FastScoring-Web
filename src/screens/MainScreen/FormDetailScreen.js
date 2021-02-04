import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DownloadOutlined, DeleteFilled, EditOutlined } from '@ant-design/icons'
import { Row, Col, Button, Typography, Skeleton, message, Image } from 'antd'
import DeleteFormModal from '../../components/form/DeleteFormModal'
import EditFormModal from '../../components/form/FormModal'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'

const { Title } = Typography

export default function FormDetailScreen (props) {
  const { id } = useParams()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState(false)
  const [form, setForm] = useState(null)
  // const [isLoading, setLoading] = useState(false)

  const deleteToggle = () => {
    if (id === 'hl1xtxWD7QzZYpTr7yWA') {
      message.error('ไม่สามารถลบฟอร์มมาตรฐานได้')
      return
    }
    setDeleteConfirm(!deleteConfirm)
  }
  const editToggle = () => {
    if (id === 'hl1xtxWD7QzZYpTr7yWA') {
      message.error('ไม่สามารถแก้ไขฟอร์มมาตรฐานได้')
      return
    }
    if (!prevent('Form', form)) return
    setEditForm(!editForm)
  }

  useEffect(() => {
    const db = firebase.firestore()
    const ref = db.collection('forms').doc(id)
    const unsub = ref.onSnapshot(s => {
      if (!s.exists) setForm(() => (false))
      setForm(() => (s.data()))
    })

    return () => {
      console.log('unmount')
      unsub && unsub()
    }
  }, [])

  const prevent = (item, data) => {
    if (!data) {
      message.error('Error ' + item + ' Not Found!')
      return false
    } else return true
  }

  const downloadPDF = () => {
    if (!prevent('Form', form)) return
    if (!form.url || !form.url.form) {
      message.error('no pdf file found')
      return
    }
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
      {
        form === null
          ? null
          : <EditFormModal
              modalName="Edit Form"
              visible={editForm}
              toggleModal={editToggle}
              edit={true}
              form={form}
              id={id}
            />
      }
      <Title level={1}>
        {
          form === null ? <Skeleton paragraph={false} active /> : form.name || 'ฟอร์มที่ยังไม่มีชื่อ'
        }
      </Title>
      <Row justify="space-between">
        <Col xs={24} md={12}>
          <Row>
            <Button onClick={downloadPDF} icon={<DownloadOutlined />}>
              Download Original PDF File
            </Button>
            <Button
              onClick={editToggle}
              type="primary"
              shape="round"
              style={{ marginLeft: 10 }}
              icon={<EditOutlined />}
              size={50}>
              Edit Form
            </Button>
          </Row>
        </Col>
        <Col xs={2}>
          <Button onClick={deleteToggle} icon={<DeleteFilled />} shape="circle" type="primary" danger />
        </Col>
      </Row>
      <Row>
        <Col xs={24} md={12}>
          <Title level={3}>Answer Section :</Title>
          {
            form === null
              ? <Skeleton paragraph={false} active />
              : form.url && form.url.answersheet
                ? <Image src={form.url.answersheet} />
                : null
          }
        </Col>
        <Col xs={24} md={12}>
          <Title level={3}>Student Section :</Title>
          {
            form === null
              ? <Skeleton paragraph={false} active />
              : form.url && form.url.student
                ? <Image src={form.url.student} />
                : null
          }
        </Col>
      </Row>
    </>
  )
}
