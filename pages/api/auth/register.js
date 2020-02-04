export default (req, res) => {
  if (req.method !== "POST") {
    res.status(405).end(); //Method not Allowed.
    return;
  }
  console.log("POST request received");
};
