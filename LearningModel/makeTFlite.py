import sys
import time
import datetime
import shutil
import asyncio

# def getName(name, age): 
#     print (name + " : " + age) 

def mkf(name):
    src = '../fordemo_ftlites/fordemo_afterLearning/yolov4-tiny-416.tflite'
    dst = "./LearningModel/tflite_result/"+name+".tflite"
    shutil.copy(src,dst)
    src = '../fordemo_ftlites/fordemo_afterLearning/eng.txt'
    dst = './LearningModel/label/eng.txt'
    shutil.copy(src,dst)
    src = '../fordemo_ftlites/fordemo_afterLearning/kor.txt'
    dst = './LearningModel/label/kor.txt'
    shutil.copy(src,dst)
    # f = open("./LearningModel/tflite_result/"+name+".tflite",'w')
    # f.write(t1)
    # f.write(t2)
    # f.close()

if __name__ == '__main__': 
    print('weight file learning is start !!')
    #3초 대기
    # t1 = sys.argv[1]
    # t2 = sys.argv[2]
    # getName(t1, t2)
    mkf(datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
    # print('weight file learning is over !!')/