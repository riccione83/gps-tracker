import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  cancelTitle: string;
  successTitle: string;
}

const ModalComponent = ({open, onClose, onSuccess, ...props}: ModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => {
        onClose();
      }}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{props.title}</Text>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => onSuccess()}>
            <Text style={styles.textStyle}>{props.successTitle}</Text>
          </Pressable>
          <View style={styles.spacer} />
          <Pressable
            style={[styles.button, styles.buttonOpen]}
            onPress={() => onClose()}>
            <Text style={styles.textStyle}>{props.cancelTitle}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  spacer: {
    marginBottom: 16,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default ModalComponent;
