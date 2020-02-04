import { User } from "../../../model";

export default async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).end(); //Method not Allowed.
    return;
  }

  const { email, password, passwordConfirmation } = req.body;

  if (password === passwordConfirmation) {
    try {
      const user = await User.create({ email, password });
      return res.end(
        JSON.stringify({ status: "success", message: "User Added" })
      );
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        error = error.errors[0].message;
      }
      return res.end(
        JSON.stringify({
          status: "error",
          error
        })
      );
    }
  } else {
    console.log(password, passwordConfirmation);
    return res.end(
      JSON.stringify({
        status: "failed",
        message: " The passwords do not match, please try again"
      })
    );
  }
  // console.log("POST request received");
  // console.log(req.body);
  // res.status(200).send({
  //   message: "success"
  // });
};
