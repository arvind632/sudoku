var db = require('../../config/db.Config');
var connection = db;
var md5 = require("md5");
var nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
const Email = require('email-templates');

var transporter = nodemailer.createTransport({
	// service: 'gmail',
	host: 'mail.doctorpatient.broadwayinfotech.net.au',
	port: 465,
	secure: true,
	auth: {
		user: 'smtpemail@doctorpatient.broadwayinfotech.net.au',
		pass: 'gon%Mx[*a*.q'
	}
});

const email = new Email({
	transport: transporter,
	send: true,
	preview: false,
});




exports.getTestMail = function (req, res) {
	email.send({
		template: 'welcome',
		message: {
			from: 'Doctor Patient Portal <no-reply@doctorpatient.com>',
			to: 'arvindsingh632@gmail.com',
		},
		locals: {
			fname: 'Arvind',
			lname: 'Singh',
			subject: "Registration Successfully ",
			body: 'Welcome to the join doctor patient portal .',
		}
	}).then(() => console.log('email has been sent!'));


	res.send({
		"status": 200,
		"success": true,
	});
}








exports.register = function (req, res) {

	const data = req.body;
	const errors = {};


	if (!data.first_name) {
		errors.first_name = ['The first name field is required'];
	}
	if (!data.last_name) {
		errors.last_name = ['The last name field is required'];
	}

	if (!data.mobile) {
		errors.mobile = ['The mobile field is required'];
	}

	if (!data.age) {
		errors.age = ['The age field is required'];
	}

	if (!data.email) {

		errors.email = ['The email field is required'];
	}


	if (!data.gender) {
		errors.gender = ['The gender field is required'];
	}

	if (!data.password) {
		errors.password = ['The password field is required'];
	} else {

		if (data.password.length < 8) {
			errors.password = ['password should be minimum 8 charectors'];
		}

	}

	if (!data.password_confirmation) {
		errors.password_confirmation = ['The confirm password is required'];
	} else {
		if (data.password != data.password_confirmation) {
			errors.password_confirmation = ['The password and confirm password does not match'];
		}
	}

	if (Object.keys(errors).length > 0) {
		res.send({
			"status": 'failed',
			"errors": errors,
		})
	}

	else {

		var today = new Date();
		var password = data.password;
		var patientRecords = {

			"mobile": data.mobile,
			"email": data.email,
			"password": md5(password),
			"type": 'patient',
		}





		connection.query("SELECT COUNT(*) AS mobile FROM members WHERE mobile = ? ",
			data.mobile, function (error, results) {
				if (error) {
					res.send({
						"status": 'failed',
						"success": false,
						"message": 'failed to register'
					})
				}
				else {

					if (results[0].mobile > 0) {
						errors.mobile = ['The mobile is already exists'];
						res.send({
							"status": 'failed',
							"errors": errors,
						})

					} else {


						connection.query("SELECT COUNT(*) AS cnt FROM members WHERE email = ? ",
							data.email, function (error, results) {
								if (error) {
									res.send({
										"status": 'failed',
										"success": false,
										"message": 'failed to register'
									})
								}
								else {

									if (results[0].cnt > 0) {

										errors.email = ['The email is already exists'];
										res.send({
											"status": 'failed',
											"errors": errors,
										})

									} else {

										connection.query('INSERT INTO members SET ?', patientRecords, function (error, results, fields) {
											if (error) {
												console.log("error ocurred", error);
												res.send({
													"status": 'failed',
													"success": false,
													"message": 'failed to register'
												})
											}
											else {
												console.log('The solution is: ', results);

												var memberRecords = {
													"member_id": results.insertId,
													"first_name": data.first_name,
													"last_name": data.last_name,
													"mobile": data.mobile,
													"age": data.age,
													"gender": data.gender,
													"email": data.email,
													"relation": "Self",
													"status": 1
												}

												connection.query('INSERT INTO membercontacts SET ?', memberRecords, function (error, results, fields) {

													if (error) {
														console.log("error ocurred", error);
														res.send({
															"status": 'failed',
															"success": false,
															"message": 'failed to register'
														})
													}
													else {
														console.log('The inserted data is: ', results);

														/* Start mail */


														email.send({
															template: 'welcome',
															message: {
																from: 'Doctor Patient Portal <no-reply@doctorpatient.com>',
																to: data.email,
															},
															locals: {
																fname: data.first_name,
																lname: data.last_name,
																subject: "Registration Successfully ",
																body: 'Welcome to the join doctor patient portal .',
															}
														})
															.then(() =>
																console.log('email has been sent!'))
															.catch((error) =>
																console.log("Send Mail Catch error :", error));


														/* End mail */
														res.send({
															"status": 200,
															"success": true,
															"message": "Patient registered sucessfully",
															"insertedId": results.insertId
														});
													}

												});


											}

										});
									}
								}


							});

					}
				}
			});





	}
}



exports.login = function (req, res) {
	var email = req.body.email;
	var password = req.body.password;
	var loginAs = req.body.loginAs;
	var profileData = {};
	const errors = {};

	if (!req.body.email) {
		errors.email = ['The email or mobile is required'];
	}

	if (!req.body.password) {
		errors.password = ['The password is required'];
	}

	if (!req.body.loginAs) {
		errors.loginAs = ['The loginAs is required'];
	}


	if (Object.keys(errors).length > 0) {
		res.send({
			status: 'failed',
			validation_error: errors,
		})
	} else {
		// login through email or mobile 

		if (loginAs == "patient") {
			connection.query('SELECT members.id as memberId,members.email,members.mobile,members.password,membercontacts.* FROM membercontacts Left Join members ON members.id=membercontacts.member_id WHERE members.email = ? OR members.mobile = ? AND members.status = ? AND members.type = ?', [email, email, 1, 'patient'], function (error, results, fields) {
				if (error) {
					res.send({
						status: 'failed',
						failed: "error ocurred"
					})
				}
				else {

					if (results.length > 0) {
						if (results[0].password == md5(password)) {
							// req.session.loggedin = true;
							// req.session.username = email;

							// Create a token 
							var token = jwt.sign({ id: results[0].memberId }, config.secret, {
								expiresIn: 86400 // expires in 24 hours
							});

							profileData = {

								id: results[0].memberId,
								membercontactId: results[0].id,
								first_name: results[0].first_name,
								last_name: results[0].last_name,
								email: results[0].email,
								mobile: results[0].mobile,
								age: results[0].age,
								gender: results[0].gender,
								madical_history: results[0].madical_history,
								relation_id: results[0].relation_id,
								profile_pic: results[0].profile_pic,

							};
							res.send({
								status: 200,
								success: true,
								token: token,
								message: "You have logged in successfully",
								data: profileData
							});

						} else {
							errors.password = ['Please enter correct password'];
							res.send({
								status: 'failed',
								validation_error: errors
							});

						}
					}
					else {
						errors.email = ['Please enter correct email or mobile'];
						res.send({
							"status": 'failed',
							"validation_error": errors
						});
					}
				}


			});

		}

		else // Login As Doctor 
		{
			console.log("test1--");
			connection.query('SELECT t1.id, t1.email,t1.mobile,t1.password,t1.type,t2.id as doctordetailId,t2.name FROM members t1 INNER JOIN doctordetails t2 ON t1.id = t2.member_id  WHERE t1.email = ? OR t1.mobile = ? AND t1.status=? AND t1.type = ?', [email, email, 1, 'doctor'], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.send({
						"status": 'failed',
						"failed": "error ocurred"
					})
				} else {
					if (results.length > 0) {
						console.log("------success doctor login-----", results[0]);
						if (results[0].password == md5(password)) {


							// Create a token 

							var token = jwt.sign({ id: results[0].memberId }, config.secret, {
								expiresIn: 86400 // expires in 24 hours
							});


							// update doctor online / offline status

							connection.query("UPDATE doctordetails SET live = '" + 'Online' + "' where id =?", + results[0].doctordetailId, (error, liveResult, fields) => {


								profileData = {
									memberId: results[0].id,
									doctordetailId: results[0].doctordetailId,
									first_name: results[0].name,
									email: results[0].email,
									mobile: results[0].mobile,
									userType: results[0].type,

								};
								res.send({
									status: 200,
									success: true,
									token: token,
									message: "You have logged in successfully",
									data: profileData
								});

							})
						} else {
							console.log("failed--");
							errors.password = ['Please enter correct password'];
							res.send({
								status: 'failed',
								validation_error: errors
							});

						}
					} else {
						errors.email = ['Please enter correct email or mobile'];
						res.send({
							status: 'failed',
							validation_error: errors
						});
					}


				}



			});
		}
	}
}




// Update doctor offline status  

exports.doctorLogout = (req, res) => {
	const id = req.params.id;
	var status = "Offline";
	// console.log("test1",id);
	// console.log("test3");
	connection.query("UPDATE doctordetails SET live = '" + status + "' where id =?", + id, (error, result, fields) => {
		if (error) throw error;
		res.send({
			"status": true,
			"message": "Doctor logout successfully",
		})
	})
};



exports.forgotPasswordOtp = (req, res) => {

	// console.log(req.body);
	const errors = {};

	if (!req.body.email) {
		errors.email = ['The email is required'];
	}

	if (Object.keys(errors).length > 0) {
		res.send({
			status: false,
			validation_error: errors,
		})
	} else {


		connection.query('SELECT members.email FROM members WHERE email = ? AND type = ?', [req.body.email, req.body.type], function (error, results, fields) {


			/* connection.query('SELECT members.email,membercontacts.first_name,membercontacts.last_name FROM membercontacts Left Join members ON members.id = membercontacts.member_id WHERE members.email = ?  AND members.type = ? ', [req.body.email, req.body.type], function (error, results, fields) { */
			if (error) {
				res.send({
					status: false,
					failed: "error ocurred",
					message: error,
				})
			}
			else {

				if (results.length > 0) {

					console.log(" record found ");
					const otp = Math.floor(Math.random() * 1000000);
					// var password = md5(newpassword.toString());

					connection.query("UPDATE members SET otp = '" + otp + "' where email = ? AND type = ? ", [req.body.email, req.body.type], (error, result, fields) => {
						if (error) throw error;

						/* Start mail */


						email.send({
							template: 'otp',
							message: {
								from: 'Doctor Patient Portal <no-reply@doctorpatient.com>',
								to: results[0].email,
							},
							locals: {
								fname: results[0].email,
								lname: '',
								subject: "Otp for new password ",
								body: 'Your Otp is : ',
								otp: otp,
							}
						})
							.then(() =>
								console.log('email has been sent!'))
							.catch((error) =>
								console.log("Send Mail Catch error :", error));


						/* End mail */
						res.send({
							"status": true,
							"message": "Please check your mail and enter the otp",
							// "newPassword": newpassword,
						})
					})
				} else {
					console.log("record not found ");
					errors.email = ['Please enter correct email '];
					res.send({
						status: false,
						validation_error: errors
					});
				}
			}
		})
	}
};

exports.UpdatePasswordByOtp = (req, res) => {

	// console.log(req.body);
	const errors = {};
	var otp = req.body.otp;

	if (!req.body.otp) {
		errors.email = ['The otp is required'];
	}

	if (Object.keys(errors).length > 0) {
		res.send({
			status: false,
			validation_error: errors,
		})
	} else {


		connection.query('SELECT otp,email FROM members WHERE otp = ? AND type = ?', [otp, req.body.type], function (error, results, fields) {

			/*	connection.query('SELECT members.otp,members.email,membercontacts.first_name,membercontacts.last_name FROM membercontacts Left Join members ON members.id = membercontacts.member_id WHERE members.otp = ?  AND members.type = ? ', [otp, req.body.type], function (error, results, fields) {
			*/
			if (error) {
				res.send({
					status: false,
					failed: "error ocurred",
					message: error,
				})
			}
			else {

				if (results.length > 0) {


					const newpassword = Math.floor(Math.random() * 1000000);
					var password = md5(newpassword.toString());


					/* Start   Mail */

					email.send({
						template: 'newpassword',
						message: {
							from: 'Doctor Patient Portal <no-reply@doctorpatient.com>',
							to: results[0].email,
						},
						locals: {
							fname: results[0].email,
							lname: '',
							subject: "New Password ",
							body: 'Your new password is : ',
							password: newpassword,
						}
					})
						.then(() =>
							console.log('email has been sent!'))
						.catch((error) =>
							console.log("Send Mail Catch error :", error));

					/* Emd Mail */

					connection.query("UPDATE members SET password = '" + password + "',otp = null where otp = ? AND type = ? ", [otp, req.body.type], (error, result, fields) => {
						if (error) throw error;
						res.send({
							"status": true,
							"message": "Password sent on your E-mail",
							// "newPassword": newpassword,
						})
					})
				} else {
					console.log("record not found ");
					errors.email = ['Otp is not correct'];
					res.send({
						status: false,
						validation_error: errors
					});
				}
			}
		})
	}
};







// Change patient password
exports.changePassword = (req, res) => {

	const data = req.body;
	const id = req.body.memberId;
	const errors = {};
	const newPassword = md5(req.body.password);

	if (!data.password) {
		errors.password = ['The password field is required'];
	} else {

		if (data.password.length < 8) {
			errors.password = ['Password length must be minimum 8 characters'];
		}
	}

	if (!data.cpassword) {
		errors.cpassword = ['The confirm password field is required'];
	}

	if (data.password != data.cpassword) {
		errors.cpassword = ['Password and conform password does not match'];
	}

	if (Object.keys(errors).length > 0) {
		res.send({
			status: false,
			errors: errors,
		})
	} else {

		connection.query("update members SET password='" + newPassword + "'  where id = ?  AND type =?", [id, 'patient'], (error, result, fields) => {
			if (error) throw error;
			res.status(200).send({
				status: true,
				message: "Password updated successfully"
			});
		})
	}






}


















