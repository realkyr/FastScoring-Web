import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import PropTypes from 'prop-types'
import { message, Select, Image, Modal, Button, Skeleton } from 'antd'

const { Option } = Select

export default function EditChoicesModal (props) {
  const { examid } = useParams()
  const [res, setRes] = useState({})
  const [real, setReal] = useState({})
  const [editAnswer, setEdit] = useState({})
  const [loading, setLoading] = useState(false)
  const logPerColumn = []
  const [mode, setMode] = useState('form')

  const heightRes = res.h && real.height ? (res.h / real.height) : 1
  const widthRes = res.w && real.width ? (res.w / real.width) : 1

  const getCurrentImageSize = () => {
    const image = document.querySelector('#image-sd')
    if (image) {
      setRes({
        w: image.children[0].clientWidth,
        h: image.children[0].clientHeight
      })
    }
  }

  useEffect(() => {
    window.addEventListener('resize', getCurrentImageSize)
    const sizeOf = require('image-size')
    const request = require('request')
    const options = {
      url: props.image,
      method: 'get',
      encoding: null
    }
    request.get(options, function (error, response, body) {
      if (error) {
        console.error('error:', error)
      } else {
        setReal(sizeOf(body))
      }
    })
    return () => {
      window.removeEventListener('resize', getCurrentImageSize)
    }
  }, [])

  const coords = mode === 'exam' ? props.exam : props.form
  if (props.exam === null) {
    return (
      <Skeleton paragraph={false} active />
    )
  }
  return (
    <>
      <Button type="primary" onClick={() => props.setVisible(true)}>
        แก้ไขคำตอบของผู้เข้าสอบ
      </Button>
      <Modal
        title="กรุณาเลือก ช้อยส์ ที่ผู้สอบฝน"
        width={1000}
        visible={props.visible}
        confirmLoading={loading}
        onOk={async () => {
          setLoading(true)
          const db = firebase.firestore()
          const ref = db.collection('exams').doc(examid)
          const { result } = props.exam
          for (const c of Object.keys(editAnswer)) {
            result[c].user_choice = editAnswer[c]
            console.log(c, editAnswer[c])
            result[c].correct = props.calculateScore(result[c])
          }
          await ref.update({
            result
          })
          setLoading(false)
          props.setVisible(false)
          message.success('Edit User Answer Complete')
        }}
        onCancel={() => props.setVisible(false)}>
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          {Object.keys(coords.coords_choices).map(c => {
            const numChoices = props.form.num_choice
            const column = props.form.column
            const bubble = parseInt(c)
            const choicesPerColumn = parseInt(props.form.amount / props.form.column)
            const num = Math.floor(bubble / numChoices) + (bubble % numChoices ? 0 : -1)
            const stayInColumn = num % column
            const choice = bubble % numChoices ? bubble % numChoices : numChoices
            if (choice === 1) {
              logPerColumn[stayInColumn] = logPerColumn[stayInColumn] ? logPerColumn[stayInColumn] + 1 : 1
            }
            const clause = choicesPerColumn * stayInColumn + logPerColumn[stayInColumn]

            const { exam } = props
            const className = [
              'choices'
            ]
            if (exam.result[clause] && exam.result[clause].correct_choice.includes(choice)) {
              className.push('solution-choice')
            }

            // selected one original exam or tmp edit
            const selected = editAnswer[clause]
              ? editAnswer[clause]
              : exam.result[clause] && exam.result[clause].user_choice
            if (selected && selected.includes(choice)) {
              className.push('select-to-edit')
            }
            return <>
              <div
                className={[
                  ...className
                ].join(' ')}
                onClick={() => {
                  let tmpAnswer = { ...editAnswer }
                  // get original answers array, [] otherwise
                  if (!tmpAnswer[clause]) tmpAnswer[clause] = exam.result[clause].user_choice ? exam.result[clause].user_choice : []

                  // toggle item in array
                  const index = tmpAnswer[clause].indexOf(choice)
                  if (index > -1 /* check if choice in array */) {
                    tmpAnswer[clause].splice(index, 1)
                  } else {
                    tmpAnswer = {
                      ...editAnswer,
                      [clause]: [...tmpAnswer[clause], choice].sort()
                    }
                  }
                  setEdit(tmpAnswer)
                  message.success(`clause: ${clause}, choice: ${choice}`)
                }}
                style={{
                  width: 20 * widthRes,
                  height: 20 * heightRes,
                  top: coords.coords_choices[c].y * heightRes,
                  left: coords.coords_choices[c].x * widthRes
                }}
              />
            </>
          })}
        </div>
        <Image onLoad={getCurrentImageSize} id="image-sd" preview={false} src={props.image}></Image>
        <div>
          หากวงกลมแสดงผลไม่ถูกต้อง ลองเปลี่ยนโหมด ?
          <Select value={mode} onChange={mode => setMode(mode)} style={{ width: 120, marginLeft: 5 }}>
            <Option value="exam">Exam</Option>
            <Option value="form">Form</Option>
          </Select>
        </div>
      </Modal>
    </>
  )
}

EditChoicesModal.propTypes = {
  visible: PropTypes.bool,
  toggleModal: PropTypes.func,
  forms: PropTypes.object,
  setVisible: PropTypes.func,
  image: PropTypes.string,
  form: PropTypes.object,
  exam: PropTypes.object,
  calculateScore: PropTypes.func
}
