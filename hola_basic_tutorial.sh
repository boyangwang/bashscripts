#! /bin/bash

main() {
	clear
	init_globals
	init_questions

	if (( $# >= 2)); then
		ask_questions_from_to $1 $2
	else
		ask_questions_from_to 1 $NUMBER_QUESTIONS
	fi
}

init_globals() {
	readonly EXECUTE=0
	readonly STRING=1

	readonly CORRECT=0
	readonly WRONG=1

	readonly NUMBER_QUESTIONS=34
}

init_questions() {
	declare -Ag question1=( ["description"]="move one word backwards"
	["type"]="$STRING"
	["ans"]=$'\eb'
	["section"]="bash.txt" )
	declare -Ag question2=( ["description"]="move one word forward"
	["type"]="$STRING"
	["ans"]=$'\ef'
	["section"]="bash.txt" )
	declare -Ag question3=( ["description"]="delete word backwards"
	["type"]="$STRING"
	["ans"]=$'\e\x7f'
	["section"]="bash.txt" )
	declare -Ag question4=( ["description"]="delete one word forward"
	["type"]="$STRING"
	["ans"]=$'\ed'
	["section"]="bash.txt" )

	declare -Ag question5=( ["description"]="clear screen"
	["type"]="$STRING"
	["ans"]=$'\x0c'
	["section"]="bash.txt" )

	declare -Ag question6=( ["description"]="move to beginning of line"
	["type"]="$STRING"
	["ans"]=$'\x01'
	["section"]="bash.txt" )
	declare -Ag question7=( ["description"]="move to end of line"
	["type"]="$STRING"
	["ans"]=$'\x05'
	["section"]="bash.txt" )
	declare -Ag question8=( ["description"]="delete to beginning of line"
	["type"]="$STRING"
	["ans"]=$'\x15'
	["section"]="bash.txt" )
	declare -Ag question9=( ["description"]="delete to end of line"
	["type"]="$STRING"
	["ans"]=$'\x0b'
	["section"]="bash.txt" )

	declare -Ag question10=( ["description"]="move down"
	["type"]="$STRING"
	["ans"]=$'j'
	["section"]="vimtutor" )
	declare -Ag question11=( ["description"]="move up"
	["type"]="$STRING"
	["ans"]=$'k'
	["section"]="vimtutor" )
	declare -Ag question12=( ["description"]="move left"
	["type"]="$STRING"
	["ans"]=$'h'
	["section"]="vimtutor" )
	declare -Ag question13=( ["description"]="move right"
	["type"]="$STRING"
	["ans"]=$'l'
	["section"]="vimtutor" )
	declare -Ag question14=( ["description"]="move to beginning of line"
	["type"]="$STRING"
	["ans"]=$'0'
	["section"]="vimtutor" )
	declare -Ag question15=( ["description"]="move to end of line"
	["type"]="$STRING"
	["ans"]=$'$'
	["section"]="vimtutor" )
	declare -Ag question16=( ["description"]="move to next word"
	["type"]="$STRING"
	["ans"]=$'w'
	["section"]="vimtutor" )
	declare -Ag question17=( ["description"]="move to previous word"
	["type"]="$STRING"
	["ans"]=$'b'
	["section"]="vimtutor" )
	declare -Ag question18=( ["description"]="move half page down"
	["type"]="$STRING"
	["ans"]=$'\x06'
	["section"]="vimtutor" )
	declare -Ag question19=( ["description"]="move half page up"
	["type"]="$STRING"
	["ans"]=$'\x15'
	["section"]="vimtutor" )


	declare -Ag question20=( ["description"]="append at the last char of line"
	["type"]="$STRING"
	["ans"]=$'A'
	["section"]="vimtutor" )
	declare -Ag question21=( ["description"]="delete char under cursor"
	["type"]="$STRING"
	["ans"]=$'x'
	["section"]="vimtutor" )
	declare -Ag question22=( ["description"]="delete word"
	["type"]="$STRING"
	["ans"]=$'dw'
	["section"]="vimtutor" )
	declare -Ag question23=( ["description"]="redo"
	["type"]="$STRING"
	["ans"]=$'\x12'
	["section"]="vimtutor" )
	declare -Ag question24=( ["description"]="replace char at cursor with x"
	["type"]="$STRING"
	["ans"]=$'rx'
	["section"]="vimtutor" )
	declare -Ag question25=( ["description"]="remove till the end of word and start inserting"
	["type"]="$STRING"
	["ans"]=$'ce'
	["section"]="vimtutor" )
	declare -Ag question26=( ["description"]="show your location in the file and the file status"
	["type"]="$STRING"
	["ans"]=$'\x07'
	["section"]="vimtutor" )
	declare -Ag question27=( ["description"]="go to last line"
	["type"]="$STRING"
	["ans"]=$'G'
	["section"]="vimtutor" )
	declare -Ag question28=( ["description"]="go to first line"
	["type"]="$STRING"
	["ans"]=$'gg'
	["section"]="vimtutor" )
	declare -Ag question29=( ["description"]="go to line number 12"
	["type"]="$STRING"
	["ans"]=$'12G'
	["section"]="vimtutor" )
	declare -Ag question30=( ["description"]="search for phrase ABC forward"
	["type"]="$STRING"
	["ans"]=$'/ABC'
	["section"]="vimtutor" )
	declare -Ag question31=( ["description"]="search for phrase ABC backwards"
	["type"]="$STRING"
	["ans"]=$'?ABC'
	["section"]="vimtutor" )
	declare -Ag question32=( ["description"]="search for phrase ABC and replace by DEF, global, confirm"
	["type"]="$STRING"
	["ans"]=$':%s/ABC/DEF/gc'
	["section"]="vimtutor" )
	declare -Ag question33=( ["description"]="execute ls externally"
	["type"]="$STRING"
	["ans"]=$':!ls'
	["section"]="vimtutor" )
	declare -Ag question34=( ["description"]="open new line and start inserting"
	["type"]="$STRING"
	["ans"]=$'o'
	["section"]="vimtutor" )

	declare -Ag question35=( ["description"]="search for all .html files for the text Access any website"
	["type"]="$EXECUTE"
	["ans"]='./Hola.html:          <span class="simple-header ng-scope" translate="">Access any website</span>'
	["section"]="bash.txt" )
}

ask_questions_from_to() {
	upperlim=$2
	for (( i=$1; i<=upperlim; i++ )); do
		ask_question $i
	done
}

ask_question() {
	print_question_number_section_description $1

	temp=question$1[type]

	if [ ${!temp} == $STRING ]; then
		ans=$(capture_ans_string)
	elif [ ${!temp} == $EXECUTE ]; then
		ans=$(capture_ans_execute)
	else
		ans=
	fi

	print_actual_expected_ans $1 $ans

	if [ "$ans" == "$temp" ]; then
		print_feedback $CORRECT
	else
		print_feedback $WRONG
	fi
}

print_actual_expected_ans() {
	echo -e '\b\b  '
	echo -ne "\nYour answer is: "
	printf "%s\n" $2
	temp=question$1[ans]
	echo -n "Correct answer is: "
	temp=$(printf "%b" ${!temp} | xxd -p)
	printf "%s\n" $temp
}

print_question_number_section_description() {
	printf "ASKING QN NO.$1\n"
	temp=question$1[section]

	printf "\e[4m%s:\e[0m " "${!temp}"

	temp=question$1[description]
	printf "%s:\n" "${!temp}"
}

capture_ans_string() {
	ans=
	while true;do
	    stty_state=$(stty -g)
	    #Save stty to reset to default
	    stty raw isig
	    keypress=$(dd conv=sync count=1 2>/dev/null)
	    #Capture one character at a time
	    stty "$stty_state"
	    keycode=$(printf "%s" "$keypress" | xxd -p)
	    if [ "$keycode" == "04" ] || [ "$keycode" == "0d" ]; then
				break
	    fi
	    #Revert stty back
	    ans=$ans$keycode
	done
	echo -n $ans
}

capture_ans_execute() {
	read -e cmd
	echo $($cmd)
}

print_feedback() {
	if [ "$1" == "$CORRECT" ]; then
		echo -en "\e[7;32mRIGHT!\e[0m"
	else
		echo -en "\e[7;31mWRONG!\e[0m"
	fi

	printf "\n\n\n"
}

str_to_hex() {
	printf $(printf "%s" "$1" | xxd -p )
}

main $1 $2
