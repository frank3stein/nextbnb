const House = ({picture, type, town, title, rating, reviewsCount}) =>(
    <div>
        <img src={picture} alt="Picture of the house"/>
        <p>{type} - {town}</p>
        <p>{title}</p>
        <p>{rating} ({reviewsCount})</p>
    </div>
)

export default House;