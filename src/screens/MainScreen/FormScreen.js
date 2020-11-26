import React from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

import AddFormModal from '../../components/form/AddFormModal'

export default class FormScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      modalVisible: false
    }

    this.toggleModal = this.toggleModal.bind(this)
  }

  toggleModal () {
    this.setState({ modalVisible: !this.state.modalVisible })
  }

  render () {
    const { modalVisible } = this.state
    return (
      <>
        <AddFormModal visible={modalVisible} toggleModal={this.toggleModal} />
        <Button
          onClick={this.toggleModal}
          size="large"
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
        />
      </>
    )
  }
}
