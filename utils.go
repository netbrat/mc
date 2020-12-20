package mc

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"reflect"
	"strings"
)

/*
 * 将带下线划的字符串转成驼峰写法
 * lower true 小驼峰， false 大驼峰
 */
func ToCamelCase(str string, lower bool) string {
	if str == "" {
		return str
	}

	temp := strings.Split(str, "_")
	firstString := ""
	n := -1
	if lower {
		n = 0
		firstString = temp[0]
	}
	var upperStr string
	for y := 0; y < len(temp); y++ {
		vv := []rune(temp[y])
		if y != n {
			for i := 0; i < len(vv); i++ {
				if i == 0 {
					vv[i] -= 32
					upperStr += string(vv[i]) // + string(vv[i+1])
				} else {
					upperStr += string(vv[i])
				}
			}
		}
	}
	return firstString + upperStr
}

//查找元素是否在数组中
func inArray(obj interface{}, target interface{}) bool {
	targetValue := reflect.ValueOf(target)
	switch reflect.TypeOf(target).Kind() {
	case reflect.Slice, reflect.Array:
		for i := 0; i < targetValue.Len(); i++ {
			if targetValue.Index(i).Interface() == obj {
				return true
			}
		}
	case reflect.Map:
		if targetValue.MapIndex(reflect.ValueOf(obj)).IsValid() {
			return true
		}
	}

	return false
}

func jsonFileToStruct(file string, obj interface{}) error {
	if data, err := ioutil.ReadFile(file); err != nil{
		return err
	}else{
		data = bytes.TrimPrefix(data, []byte("\xef\xbb\xbf"))
		return json.Unmarshal(data, obj)
	}
}
