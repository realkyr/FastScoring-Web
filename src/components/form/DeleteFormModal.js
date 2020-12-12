import React, { useState } from 'react'
import { Modal, Typography } from 'antd'
import PropTypes from 'prop-types'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

const { Paragraph } = Typography

export default function DeleteFormModal (props) {
  const { visible, toggleModal, form, id } = props
  const [isLoading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const storage = firebase.storage()
    const user = firebase.auth().currentUser
    const ref = storage.ref()
    const db = firebase.firestore()
    const buffer = [
      ref.child(`forms/${user.uid}/${id}_form.pdf`).delete(),
      db.collection('forms').doc(id).delete()
    ]

    if (form.analysed_answersheet_path) buffer.push(ref.child(form.analysed_answersheet_path).delete())
    if (form.analysed_stu_path) buffer.push(ref.child(form.analysed_stu_path).delete())
    if (form.answer_sheet_path) buffer.push(ref.child(form.answer_sheet_path).delete())
    if (form.student_path) buffer.push(ref.child(form.student_path).delete())

    await Promise.all(buffer)
    setLoading(false)
    toggleModal()
  }

  return (
    <Modal
      title="คุณต้องการลบ Form ออกจากระบบ ?"
      visible={visible}
      okText="แน่ใจ"
      okButtonProps={{
        danger: true
      }}
      onOk={handleDelete}
      confirmLoading={isLoading}
      onCancel={toggleModal}
    >
      <Paragraph>การกระทำเช่นนี้จะทำการลบรูปภาพและข้อมูลของฟอร์มนี้ทั้งหมด คุณแน่ใจแล้วใช่หรือไม่?</Paragraph>
    </Modal>
  )
}

DeleteFormModal.propTypes = {
  visible: PropTypes.bool,
  toggleModal: PropTypes.func,
  form: PropTypes.object,
  id: PropTypes.string
}
