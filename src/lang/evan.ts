import {makeIssue, isIssue} from "./issues";
import {isSemanticsTyped} from "./meta-model";
import {util} from "./util";
import * as sTypes from "./description";
import * as React from "react";

/**
 * Evaluates the given JSON as Evan program against the optionally-given object table.
 */
export function evaluate(json: any, objectTable: util.IDictionary = {}): any {
	return polyEval(json, {}, {}, objectTable);
}

// Note: arguments are ordered left-to-right from "entirely local" to "entirely global".
function polyEval(json: any, values: util.IDictionary, functionTable: util.IDictionary, objectTable: util.IDictionary): any {
	if (util.isArrayLike(json)) {
		return (json as any[]).map(item => polyEval(item, values, functionTable, objectTable));
	}
	if (util.isObject(json)) {
		if (isSemanticsTyped(json)) {
			const object = json as sTypes.SemanticsTyped;
			switch (object.$sType) {
				case "binary operation": return evaluators.evaluateBinaryOperation(object, values, functionTable, objectTable, polyEval);
				case "comments": return undefined;
				case "function application": return evaluators.evaluateFunctionApplication(object, values, functionTable, objectTable, polyEval);
				case "function definition": return evaluators.evaluateFunctionDefinition(object, functionTable);
				case "function reference": return evaluators.evaluateFunctionReference(object, functionTable);
				case "HTML element": return evaluators.evaluateHtmlElement(object, values, functionTable, objectTable, polyEval);
				case "if-then-else": return evaluators.evaluateIfThenElse(object, values, functionTable, objectTable, polyEval);
				case "issue": return undefined;
				case "object-function invocation": return evaluators.evaluateObjectFunctionInvocation(object, values, functionTable, objectTable, polyEval);
				case "value reference": return evaluators.evaluateValueReference(object, values);
				default: return makeIssue(`Cannot evaluate object with sType="${json.$sType}".`, object);
			}
		}
		const result = {};
		for (let propertyName in json) {
			if (json.hasOwnProperty(propertyName)) {
				result[propertyName] = polyEval(json[propertyName], values, functionTable, objectTable);
			}
		}
		return result;
	}
	return json;	// TODO  find out: why undefined -> null?
}


/**
 * The implementation of the semantics of all the existing sTypes.
 */
export namespace evaluators {

	export type Evaluator = (json: any, values: util.IDictionary, functionTable: util.IDictionary, objectTable: util.IDictionary) => any;

	export function evaluateBinaryOperation(
		operation: sTypes.IBinaryOperation, values: util.IDictionary, functionTable: util.IDictionary, objectTable: util.IDictionary, polyEval: Evaluator
	): any {
		const leftEval = polyEval(operation.left, values, functionTable, objectTable);
		const rightEval = polyEval(operation.right, values, functionTable, objectTable);
		try {
			switch (operation.operator) {
				case "+": return leftEval + rightEval;
				case "<": return leftEval < rightEval;
				default: return makeIssue(`Binary operator "${operation.operator}" not handled.`, operation);
			}
		} catch (e) {
			return makeIssue(`Could not execute binary operation with operator="${operation.operator}"; reason: ${e}.`, operation);
		}
		// TODO  add a lot of checking
	}

	export function evaluateFunctionApplication(
		call: sTypes.IFunctionApplication, values: util.IDictionary, functionTable: util.IDictionary, objectTable: util.IDictionary, polyEval: Evaluator
	): any {
		const definition = polyEval(call.function, values, functionTable, objectTable);
		if (definition === undefined || !isSemanticsTyped(definition) || definition.$sType !== "function definition") {
			return makeIssue(`Function does not resolve to function definition`, definition);
		}
		// TODO  check arguments against parameters
		const newValues: util.IDictionary = {};
		for (let parameterName in definition.parameters) {
			const argEval = polyEval(call.arguments[parameterName], values, functionTable, objectTable);
			newValues[parameterName] = argEval;
		}
		return polyEval(definition.body, newValues, functionTable, objectTable);
	}

	export function evaluateFunctionReference(
		call: sTypes.IFunctionReference, functionTable: util.IDictionary
	): sTypes.IFunctionDefinition | sTypes.IIssue | void {
		if (!call.name || !util.isString(call.name)) {
			return makeIssue(`Function reference has no name.`, call);
		}
		return functionTable[call.name];
	}

	export function evaluateFunctionDefinition(
		definition: sTypes.IFunctionDefinition, functionTable: util.IDictionary
	): sTypes.IIssue | void {
		const {name} = definition;
		if (!name || !util.isString(name)) {
			return makeIssue(`Function definition lacks string-valued name field.`, definition);
		}
		if (name in functionTable) {
			return makeIssue(`Function definition '${name}' was already defined.`, definition);
		}
		// TODO  check parameters and return type
		functionTable[name] = definition;
		return undefined;
	}

	export function evaluateHtmlElement(
		htmlElement: sTypes.IHtmlElement, values: util.IDictionary, functionTable: util.IDictionary, objectTable: util.IDictionary, polyEval: Evaluator
	): React.DOMElement<string, Element> | void {
		// TODO  do not hardcode this (React) in here
		const props: any = {};
		if (htmlElement.classes) {
			props.className = (htmlElement.classes as any).join(" ");
		}
		return React.createElement(htmlElement.tag, props, polyEval(htmlElement.contents, values, functionTable, objectTable));
	}

	export function evaluateIfThenElse(
		ifThenElse: sTypes.IIfThenElse, values: util.IDictionary, functionTable: util.IDictionary, objectTable: util.IDictionary, polyEval: Evaluator
	): any {
		if (!ifThenElse.condition || !ifThenElse.trueBranch || !ifThenElse.falseBranch) {
			return makeIssue(`If-then-else object not complete.`, ifThenElse);
		}
		const conditionEval = polyEval(ifThenElse.condition, values, functionTable, objectTable);
		if (util.isBoolean(conditionEval)) {
			return polyEval(conditionEval ? ifThenElse.trueBranch : ifThenElse.falseBranch, values, functionTable, objectTable);
		} else {
			const issue = makeIssue(`Condition of if-then-else does not evaluate to boolean.`, ifThenElse);
			if (isIssue(conditionEval)) {
				issue.causedBy = conditionEval;
			}
			return issue;
		}
	}

	export function evaluateObjectFunctionInvocation(
		objectFunctionInvocation: sTypes.IObjectFunctionInvocation, values: util.IDictionary, functionTable: util.IDictionary, objectTable: util.IDictionary, polyEval: Evaluator
	): any {
		const objectName = objectFunctionInvocation.object;
		if (!(objectName in objectTable)) {
			return makeIssue(`Object '${objectName}' not injected.`, objectFunctionInvocation);
		}
		const functionName = objectFunctionInvocation.function;
		if (!(functionName in objectTable[objectName])) {
			return makeIssue(`Object '${objectName}' has no function '${functionName}'.`, objectFunctionInvocation);
		}
		const func = objectTable[objectName][functionName];
		if (!util.isFunction(func)) {
			return makeIssue(`Property '${functionName}' of '${objectName}' is not a function.`, objectFunctionInvocation);
		}
		const argumentValues: any[] = [];
		for (let argument of objectFunctionInvocation.arguments) {
			const argEval = polyEval(argument, values, functionTable, objectTable);
			argumentValues.push(argEval);
		}
		try {
			return func.apply(null, argumentValues);
		} catch (e) {
			return makeIssue(`Calling function '${functionName}' on object '${objectName}' produced an Error: ${e.toString()}`, objectFunctionInvocation);
		}
	}

	export function evaluateValueReference(
		valueRef: sTypes.IValueReference, values: util.IDictionary
	): any {
		const {name} = valueRef;
		return name && util.isString(name) && (name in values)
			? values[name]
			: makeIssue(`"${name}" is not a valid name for a value reference.`);
	}

}
